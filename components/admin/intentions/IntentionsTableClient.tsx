'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/admin/DataTable';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import {
  Eye, RefreshCw, Loader2, Unlock, XCircle,
  Filter, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import Link from 'next/link';
import { cancelIntentionAction, unlockIntentionAction } from '@/app/actions/admin-intentions.actions';
import type { AdminIntentionResponse } from '@/modules/admin/admin-intentions.service';

type IntentionStatus = AdminIntentionResponse['status'];

const statusConfig: Record<IntentionStatus, { label: string; variant: string }> = {
  ACTIVE: { label: 'Activa', variant: 'success' },
  LOCKED: { label: 'Bloqueada', variant: 'warning' },
  CANCELLED: { label: 'Cancelada', variant: 'secondary' },
  REPLACED: { label: 'Reemplazada', variant: 'secondary' },
};

export interface IntentionFilters {
  status?: string;
  from?: string;
  to?: string;
  amountMin?: string;
  amountMax?: string;
  termDays?: string;
  installmentCount?: string;
  isFirstLoan?: string;
}

interface IntentionsTableClientProps {
  data: AdminIntentionResponse[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
  currentFilters: IntentionFilters;
}

export function IntentionsTableClient({ data, pagination, currentFilters }: IntentionsTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [viewing, setViewing] = useState<AdminIntentionResponse | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(() => {
    // Abrir filtros si hay alguno activo (aparte de status)
    const { status, ...rest } = currentFilters;
    return Object.values(rest).some(v => v != null && v !== '');
  });

  // Contar filtros activos
  const activeFilterCount = Object.values(currentFilters).filter(v => v != null && v !== '').length;

  const columns: ColumnDef<AdminIntentionResponse, any>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <button onClick={() => setViewing(row.original)} className="font-mono text-[10px] text-primary hover:underline cursor-pointer truncate max-w-[80px] block">
          {row.original.id.slice(0, 8)}…
        </button>
      ),
    },
    {
      accessorKey: 'userId',
      header: 'Usuario',
      cell: ({ row }) => (
        <Link href={`/admin/users/${row.original.userId}`} className="font-mono text-[10px] text-muted-foreground hover:text-primary transition-colors truncate max-w-[80px] block">
          {row.original.userId.slice(0, 8)}…
        </Link>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const cfg = statusConfig[row.original.status];
        return <Badge variant={cfg.variant as any} className="text-[10px]">{cfg.label}</Badge>;
      },
    },
    {
      accessorKey: 'amount',
      header: () => <span className="text-right block">Monto</span>,
      cell: ({ row }) => <span className="text-right block font-mono text-xs">S/ {Number(row.original.amount).toLocaleString()}</span>,
    },
    {
      accessorKey: 'termDays',
      header: 'Plazo',
      cell: ({ row }) => <span className="text-xs">{row.original.termDays} días</span>,
    },
    {
      accessorKey: 'installmentCount',
      header: 'Cuotas',
      cell: ({ row }) => <span className="text-xs">{row.original.installmentCount}</span>,
    },
    {
      accessorKey: 'isFirstLoan',
      header: '1er prést.',
      cell: ({ row }) => <span className="text-xs">{row.original.isFirstLoan ? 'Sí' : 'No'}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Creada',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString('es-PE')}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setViewing(row.original)}>
          <Eye className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  // ── Navegación con filtros ────────────────────────────────────────────────

  const applyFilters = (newFilters: Partial<IntentionFilters>) => {
    const params = new URLSearchParams(searchParams.toString());
    // Mantener tab
    if (!params.has('tab')) params.set('tab', 'users');
    // Reset page al filtrar
    params.set('page', '1');

    const merged = { ...currentFilters, ...newFilters };
    // Setear o eliminar cada filtro
    const filterKeys: (keyof IntentionFilters)[] = [
      'status', 'from', 'to', 'amountMin', 'amountMax', 'termDays', 'installmentCount', 'isFirstLoan',
    ];
    for (const key of filterKeys) {
      const val = merged[key];
      if (val != null && val !== '') {
        params.set(key, val);
      } else {
        params.delete(key);
      }
    }

    startTransition(() => { router.push(`/admin/intentions?${params.toString()}`); });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    params.set('tab', 'users');
    params.set('page', '1');
    startTransition(() => { router.push(`/admin/intentions?${params.toString()}`); });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    startTransition(() => { router.push(`/admin/intentions?${params.toString()}`); });
  };

  const handleRefresh = () => {
    startTransition(() => { router.refresh(); });
  };

  // ── Acciones ──────────────────────────────────────────────────────────────

  const handleCancel = (id: string) => {
    setActionMsg(null);
    startTransition(async () => {
      const result = await cancelIntentionAction(id);
      if (result.ok) {
        setActionMsg({ type: 'success', text: 'Intención cancelada' });
        setViewing(null);
        router.refresh();
      } else {
        setActionMsg({ type: 'error', text: result.error ?? 'Error' });
      }
    });
  };

  const handleUnlock = (id: string) => {
    setActionMsg(null);
    startTransition(async () => {
      const result = await unlockIntentionAction(id);
      if (result.ok) {
        setActionMsg({ type: 'success', text: 'Intención desbloqueada' });
        setViewing(null);
        router.refresh();
      } else {
        setActionMsg({ type: 'error', text: result.error ?? 'Error' });
      }
    });
  };

  return (
    <>
      <div className="space-y-4">
        {/* ── Barra superior: estado + filtros + refresh ── */}
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <div className="flex items-center gap-3 flex-wrap">
            <NativeSelect
              value={currentFilters.status ?? ''}
              onChange={(e) => applyFilters({ status: e.target.value || undefined })}
              className="h-9 w-40"
            >
              <NativeSelectOption value="">Todos los estados</NativeSelectOption>
              <NativeSelectOption value="ACTIVE">Activa</NativeSelectOption>
              <NativeSelectOption value="LOCKED">Bloqueada</NativeSelectOption>
              <NativeSelectOption value="CANCELLED">Cancelada</NativeSelectOption>
              <NativeSelectOption value="REPLACED">Reemplazada</NativeSelectOption>
            </NativeSelect>

            <CollapsibleTrigger>
              <Button variant="outline" size="sm" className="h-9 gap-2" type="button">
                <Filter className="h-4 w-4" />
                Filtros
                {activeFilterCount > 0 && (
                  <Badge variant="default" className="h-5 min-w-5 px-1 text-[10px]">{activeFilterCount}</Badge>
                )}
                {filtersOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>

            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" className="h-9 gap-1 text-xs text-muted-foreground" onClick={clearAllFilters}>
                <X className="h-3.5 w-3.5" /> Limpiar filtros
              </Button>
            )}

            <div className="ml-auto">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isPending} className="h-9 gap-2">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Actualizar
              </Button>
            </div>
          </div>

          {/* ── Panel de filtros avanzados ── */}
          <CollapsibleContent>
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Monto */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Monto mínimo</Label>
                  <Input
                    type="number"
                    placeholder="Ej: 1000"
                    defaultValue={currentFilters.amountMin ?? ''}
                    className="h-8 text-sm"
                    onBlur={(e) => applyFilters({ amountMin: e.target.value || undefined })}
                    onKeyDown={(e) => { if (e.key === 'Enter') applyFilters({ amountMin: (e.target as HTMLInputElement).value || undefined }); }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Monto máximo</Label>
                  <Input
                    type="number"
                    placeholder="Ej: 10000"
                    defaultValue={currentFilters.amountMax ?? ''}
                    className="h-8 text-sm"
                    onBlur={(e) => applyFilters({ amountMax: e.target.value || undefined })}
                    onKeyDown={(e) => { if (e.key === 'Enter') applyFilters({ amountMax: (e.target as HTMLInputElement).value || undefined }); }}
                  />
                </div>

                {/* Plazo */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Plazo (días)</Label>
                  <NativeSelect
                    value={currentFilters.termDays ?? ''}
                    onChange={(e) => applyFilters({ termDays: e.target.value || undefined })}
                    className="h-8 text-sm"
                  >
                    <NativeSelectOption value="">Todos</NativeSelectOption>
                    <NativeSelectOption value="15">15 días</NativeSelectOption>
                    <NativeSelectOption value="30">30 días</NativeSelectOption>
                    <NativeSelectOption value="45">45 días</NativeSelectOption>
                    <NativeSelectOption value="60">60 días</NativeSelectOption>
                    <NativeSelectOption value="90">90 días</NativeSelectOption>
                  </NativeSelect>
                </div>

                {/* Cuotas */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Cuotas</Label>
                  <NativeSelect
                    value={currentFilters.installmentCount ?? ''}
                    onChange={(e) => applyFilters({ installmentCount: e.target.value || undefined })}
                    className="h-8 text-sm"
                  >
                    <NativeSelectOption value="">Todas</NativeSelectOption>
                    <NativeSelectOption value="1">1 cuota</NativeSelectOption>
                    <NativeSelectOption value="2">2 cuotas</NativeSelectOption>
                    <NativeSelectOption value="3">3 cuotas</NativeSelectOption>
                    <NativeSelectOption value="4">4 cuotas</NativeSelectOption>
                    <NativeSelectOption value="6">6 cuotas</NativeSelectOption>
                  </NativeSelect>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Primer préstamo */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Tipo cliente</Label>
                  <NativeSelect
                    value={currentFilters.isFirstLoan ?? ''}
                    onChange={(e) => applyFilters({ isFirstLoan: e.target.value || undefined })}
                    className="h-8 text-sm"
                  >
                    <NativeSelectOption value="">Todos</NativeSelectOption>
                    <NativeSelectOption value="true">Primer préstamo</NativeSelectOption>
                    <NativeSelectOption value="false">Recurrente</NativeSelectOption>
                  </NativeSelect>
                </div>

                {/* Fecha desde */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Desde</Label>
                  <Input
                    type="date"
                    defaultValue={currentFilters.from?.split('T')[0] ?? ''}
                    className="h-8 text-sm"
                    onChange={(e) => {
                      const val = e.target.value;
                      applyFilters({ from: val ? `${val}T00:00:00` : undefined });
                    }}
                  />
                </div>

                {/* Fecha hasta */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Hasta</Label>
                  <Input
                    type="date"
                    defaultValue={currentFilters.to?.split('T')[0] ?? ''}
                    className="h-8 text-sm"
                    onChange={(e) => {
                      const val = e.target.value;
                      applyFilters({ to: val ? `${val}T23:59:59` : undefined });
                    }}
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ── Tabla ── */}
        <DataTable
          columns={columns}
          data={data}
          pagination={pagination}
          onPageChange={handlePageChange}
          isLoading={isPending}
        />
      </div>

      {/* ── Modal de detalle ── */}
      <Dialog open={!!viewing} onOpenChange={() => { setViewing(null); setActionMsg(null); }}>
        <DialogContent className="max-w-md">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm">{viewing.id.slice(0, 8)}…</span>
                  <Badge variant={statusConfig[viewing.status].variant as any} className="text-[10px]">
                    {statusConfig[viewing.status].label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold font-mono">S/ {Number(viewing.amount).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Monto</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{viewing.termDays}d</p>
                    <p className="text-[10px] text-muted-foreground">Plazo</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{viewing.installmentCount}</p>
                    <p className="text-[10px] text-muted-foreground">Cuotas</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usuario</span>
                    <Link href={`/admin/users/${viewing.userId}`} className="font-mono text-xs text-primary hover:underline">
                      {viewing.userId.slice(0, 12)}…
                    </Link>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Primer préstamo</span>
                    <span>{viewing.isFirstLoan ? 'Sí' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creada</span>
                    <span className="text-xs">{new Date(viewing.createdAt).toLocaleString('es-PE')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actualizada</span>
                    <span className="text-xs">{new Date(viewing.updatedAt).toLocaleString('es-PE')}</span>
                  </div>
                  {viewing.calculatorIntentionId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Desde landing</span>
                      <span className="font-mono text-xs">{viewing.calculatorIntentionId.slice(0, 8)}…</span>
                    </div>
                  )}
                </div>

                <Separator />
                <div className="flex gap-2">
                  {viewing.status === 'LOCKED' && (
                    <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => handleUnlock(viewing.id)} disabled={isPending}>
                      <Unlock className="h-3.5 w-3.5" /> Desbloquear
                    </Button>
                  )}
                  {viewing.status === 'ACTIVE' && (
                    <Button variant="outline" size="sm" className="text-xs gap-1.5 text-destructive border-destructive/30" onClick={() => handleCancel(viewing.id)} disabled={isPending}>
                      <XCircle className="h-3.5 w-3.5" /> Cancelar
                    </Button>
                  )}
                </div>

                {actionMsg && (
                  <p className={`text-xs ${actionMsg.type === 'success' ? 'text-emerald-600' : 'text-destructive'}`}>
                    {actionMsg.text}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
