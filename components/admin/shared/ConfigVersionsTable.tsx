'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Play, Copy, Eye, Loader2, AlertTriangle } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, type DataTablePagination } from '@/components/admin/DataTable';
import { ConfirmAction } from './ConfirmAction';

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

interface ConfigVersionsTableProps {
  versions: ConfigVersionItem[];
  onView: (id: string) => void;
  onDuplicate: (id: string) => void;
  onActivate: (id: string) => void;
  onCreate: () => void;
  pageSize?: number;
  /** Label for the module (e.g. "Disponibilidad") */
  label?: string;
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
}: ConfigVersionsTableProps) {
  const [page, setPage] = useState(1);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [confirmActivateId, setConfirmActivateId] = useState<string | null>(null);

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

  // ── Column definitions ──────────────────────────────────────────────────

  const columns: ColumnDef<ConfigVersionItem>[] = [
    {
      accessorKey: 'version',
      header: 'Versión',
      cell: ({ row }) => (
        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
          v{row.original.version}
        </span>
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
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">Activa</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
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
        return (
          <div className="flex items-center justify-end gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onView(v.id); }} title="Ver detalle de esta versión">
              <Eye className="h-3.5 w-3.5" />
            </Button>
            {!v.isActive && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-green-600 hover:text-green-700"
                onClick={(e) => { e.stopPropagation(); setConfirmActivateId(v.id); }}
                disabled={activatingId === v.id}
                title="Activar esta versión como la principal"
              >
                {activatingId === v.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDuplicate(v.id); }} title="Tomar como base para crear nueva versión">
              {duplicatingId === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
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

      {/* Confirm Activate Modal */}
      <ConfirmAction
        open={!!confirmActivateId}
        onOpenChange={(open) => { if (!open) setConfirmActivateId(null); }}
        title="¿Activar esta versión?"
        description="La versión activa actual será reemplazada por esta. Los clientes verán los cambios inmediatamente."
        confirmLabel="Sí, activar"
        onConfirm={async () => {
          if (confirmActivateId) await handleActivate(confirmActivateId);
        }}
      />
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
