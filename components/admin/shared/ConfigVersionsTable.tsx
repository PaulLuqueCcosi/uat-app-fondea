'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, MoreVertical, Eye, Play, Copy, Loader2, AlertTriangle, XCircle } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, type DataTablePagination } from '@/components/admin/DataTable';
import { ConfirmAction } from './ConfirmAction';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConfigVersionItem {
  id: string;
  version: number;
  name: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy?: string | null;
  activatedAt?: string | null;
  /** Extra info to show (e.g. "3 dimensiones, 12 reglas") */
  meta?: string;
}

/**
 * Resultado de previsualizar el impacto de activar una versión, ANTES de confirmar.
 * 'SELF' = el candidato mismo no podrá activarse tal cual está.
 * 'OTHER' = activar esto afecta a OTRA config activa (el caller redacta el mensaje,
 * este componente no sabe nada del dominio de quién llama — hoy lo usa el módulo
 * calculadora, pero también lo usan Reglas Motor y Scorecard sin este chequeo).
 */
export interface ActivationPreview {
  impact: 'SELF' | 'OTHER';
  message?: string;
  errors: string[];
}

interface ConfigVersionsTableProps {
  versions: ConfigVersionItem[];
  onView: (id: string) => void;
  onDuplicate: (id: string) => void;
  onActivate: (id: string) => void;
  onCreate: () => void;
  pageSize?: number;
  /** Label for the module (e.g. "Disponibilidad") */
  label?: string;
  /**
   * Opcional: antes de abrir la confirmación de activar, consulta si activar esta
   * versión rompe algo (ej. deja incompatible otra config activa). Si no se pasa, no
   * se hace ningún chequeo y el modal de confirmación se ve como siempre.
   */
  onPreviewActivate?: (id: string) => Promise<ActivationPreview | null>;
}

// ── Component ─────────────────────────────────────────────────────────────────

const PAGE_SIZE_DEFAULT = 5;

export function ConfigVersionsTable({
  versions,
  onView,
  onDuplicate,
  onActivate,
  onCreate,
  pageSize = PAGE_SIZE_DEFAULT,
  label,
  onPreviewActivate,
}: ConfigVersionsTableProps) {
  const [page, setPage] = useState(1);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const [confirmActivateId, setConfirmActivateId] = useState<string | null>(null);
  const [activationPreview, setActivationPreview] = useState<ActivationPreview | null>(null);

  const activeVersion = versions.find((v) => v.isActive);
  const totalPages = Math.ceil(versions.length / pageSize);
  const paged = versions.slice((page - 1) * pageSize, page * pageSize);

  const handleActivate = async (id: string) => {
    setActivatingId(id);
    await onActivate(id);
    setActivatingId(null);
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    await onDuplicate(id);
    setDuplicatingId(null);
  };

  // Antes de abrir la confirmación, si el caller provee onPreviewActivate, consultar
  // si activar esta versión rompe algo — el chequeo real vive del lado de quien llama
  // (ej. el módulo calculadora reutiliza la misma validación que ya corre al activar),
  // acá solo se muestra el resultado.
  const handleActivateClick = async (id: string) => {
    if (!onPreviewActivate) {
      setConfirmActivateId(id);
      return;
    }
    setPreviewLoadingId(id);
    const result = await onPreviewActivate(id).catch(() => null);
    setActivationPreview(result); // null = sin impacto o el preview falló — no bloquea el flujo
    setPreviewLoadingId(null);
    setConfirmActivateId(id);
  };

  // ── Column definitions ──────────────────────────────────────────────────

  const columns: ColumnDef<ConfigVersionItem>[] = [
    {
      accessorKey: 'version',
      header: 'Versión',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${row.original.isActive ? 'bg-green-500' : ''}`}
            title={row.original.isActive ? 'Versión activa' : undefined}
          />
          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
            v{row.original.version}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <div>
          <span className="text-sm font-medium">{row.original.name ?? '—'}</span>
          {row.original.description && (
            <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{row.original.description}</p>
          )}
          {row.original.meta && (
            <p className="text-[10px] text-muted-foreground">{row.original.meta}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha Creacion',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.activatedAt ?? row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const v = row.original;
        const isBusy = activatingId === v.id || duplicatingId === v.id || previewLoadingId === v.id;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                disabled={isBusy}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                title="Acciones"
              >
                {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreVertical className="h-3.5 w-3.5" />}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(v.id); }}>
                  <Eye className="h-3.5 w-3.5" />
                  Ver detalle
                </DropdownMenuItem>
                {!v.isActive && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleActivateClick(v.id); }}>
                    <Play className="h-3.5 w-3.5" />
                    Activar esta versión
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(v.id); }}>
                  <Copy className="h-3.5 w-3.5" />
                  Duplicar como nueva versión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  // ── Pagination object for DataTable ─────────────────────────────────────

  const pagination: DataTablePagination = {
    page,
    pageSize,
    totalItems: versions.length,
    totalPages,
  };

  // ── Empty state ─────────────────────────────────────────────────────────

  if (versions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No hay versiones{label ? ` de ${label}` : ''}. Crea la primera.
          </p>
          <Button onClick={onCreate} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva versión
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────

  const confirmingVersion = versions.find((v) => v.id === confirmActivateId);

  return (
    <div className="space-y-3">
      {/* Sin versión activa: puede pasar tras una desactivación en cascada por
          incompatibilidad (ver adminPricingRoutes.ts) — sin este aviso, la fila
          "Versión activa:" de abajo simplemente desaparece sin explicar nada, y
          si es Reglas de Pricing, TODO el simulador de préstamos queda caído. */}
      {!activeVersion && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive">
            No hay ninguna versión activa{label ? ` de ${label}` : ''}. Activa una versión para que el simulador de préstamos vuelva a funcionar.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {activeVersion && (
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              Versión activa:
              <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                v{activeVersion.version}
              </Badge>
              {activeVersion.name && (
                <span className="text-foreground font-medium">{activeVersion.name}</span>
              )}
            </span>
          )}
        </div>
        <Button size="sm" onClick={onCreate}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nueva versión
        </Button>
      </div>

      {/* DataTable (TanStack) */}
      <DataTable
        columns={columns}
        data={paged}
        pagination={pagination}
        onPageChange={setPage}
        enableSorting={false}
        enableColumnFilters={false}
        enableExport={false}
        pageSizeOptions={[5]}
        onRowClick={(row) => onView(row.id)}
      />

      {/* Confirm Activate Modal — con el impacto real, si el caller lo provee */}
      <ConfirmAction
        open={!!confirmActivateId}
        onOpenChange={(open) => { if (!open) { setConfirmActivateId(null); setActivationPreview(null); } }}
        title={`¿Activar la versión v${confirmingVersion?.version ?? ''}?`}
        description="La versión activa actual será reemplazada por esta. Los clientes verán los cambios inmediatamente."
        confirmLabel={activationPreview?.impact === 'SELF' ? 'Activar de todos modos' : 'Sí, activar'}
        onConfirm={async () => {
          if (confirmActivateId) await handleActivate(confirmActivateId);
          setActivationPreview(null);
        }}
      >
        {activationPreview?.impact === 'SELF' && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
            <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-destructive">
                {activationPreview.message ?? 'Esta versión no es compatible con lo que está activo y no podrá activarse.'}
              </p>
              {activationPreview.errors.map((err, i) => (
                <p key={i} className="text-[11px] text-destructive/80">• {err}</p>
              ))}
            </div>
          </div>
        )}
        {activationPreview?.impact === 'OTHER' && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-amber-900">
                {activationPreview.message ?? 'Esto puede afectar otra configuración activa.'}
              </p>
              {activationPreview.errors.map((err, i) => (
                <p key={i} className="text-[11px] text-amber-800">• {err}</p>
              ))}
            </div>
          </div>
        )}
      </ConfirmAction>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
