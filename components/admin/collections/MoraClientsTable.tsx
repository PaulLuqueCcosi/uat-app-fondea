'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/admin/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Search, RefreshCw, Loader2, Filter, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import { getDepartments } from 'ubigeo-fns';
import type { AdminMoraClientRow, ManagementStatus } from '@/modules/admin/admin-collections.types';

// ── Management status config ─────────────────────────────────────────────────

const MANAGEMENT_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  null: { label: 'Sin gestionar', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
  SENT: { label: 'En negociación', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  ACCEPTED: { label: 'Acuerdo firmado', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  REJECTED: { label: 'Rechazado', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  EXPIRED: { label: 'Expirado', bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
};

// ── Semáforo por días de mora ────────────────────────────────────────────────

function getDaysOverdueColor(days: number): string {
  if (days <= 3) return 'text-amber-600';
  if (days <= 14) return 'text-orange-600';
  return 'text-red-600';
}

function getDaysOverdueBg(days: number): string {
  if (days <= 3) return 'bg-amber-50 border-amber-200';
  if (days <= 14) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
}

// ── Columnas ─────────────────────────────────────────────────────────────────

const columns = [
  {
    accessorKey: 'clientName',
    header: 'Cliente',
    cell: ({ row }: { row: { original: AdminMoraClientRow } }) => {
      const { clientName, clientDocument } = row.original;
      return (
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-medium text-sm truncate max-w-[160px]">
            {clientName}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">{clientDocument}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'originalAmount',
    header: 'Monto original',
    cell: ({ row }: { row: { original: AdminMoraClientRow } }) => (
      <span className="text-xs font-semibold">S/ {row.original.originalAmount.toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'pendingBalance',
    header: 'Saldo pendiente',
    cell: ({ row }: { row: { original: AdminMoraClientRow } }) => (
      <span className="text-xs font-mono">S/ {row.original.pendingBalance.toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'accruedPenalty',
    header: 'Mora S/',
    cell: ({ row }: { row: { original: AdminMoraClientRow } }) => (
      <span className="text-xs font-mono text-red-600">
        + S/ {row.original.accruedPenalty.toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: 'daysOverdue',
    header: 'Días mora',
    cell: ({ row }: { row: { original: AdminMoraClientRow } }) => {
      const days = row.original.daysOverdue;
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${getDaysOverdueBg(days)} ${getDaysOverdueColor(days)}`}>
          D+{days}
        </span>
      );
    },
  },
  {
    accessorKey: 'managementStatus',
    header: 'Estado gestión',
    cell: ({ row }: { row: { original: AdminMoraClientRow } }) => {
      const status = row.original.managementStatus;
      const key = status ?? 'null';
      const cfg = MANAGEMENT_STATUS_CONFIG[key] ?? MANAGEMENT_STATUS_CONFIG['null'];
      return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
          {cfg.label}
        </span>
      );
    },
  },
];

// ── Componente ───────────────────────────────────────────────────────────────

interface MoraClientsTableProps {
  data: AdminMoraClientRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export function MoraClientsTable({ data, pagination }: MoraClientsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [isPending, startTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(() => {
    return !!(searchParams.get('city') || searchParams.get('managementStatus') || searchParams.get('minDaysOverdue'));
  });

  const activeFilterCount = [
    searchParams.get('city'),
    searchParams.get('managementStatus'),
    searchParams.get('minDaysOverdue'),
  ].filter(Boolean).length;

  const updateUrl = useCallback(
    (params: URLSearchParams) => {
      startTransition(() => { router.push(`/admin/collections?${params.toString()}`); });
    }, [router]
  );

  const applyFilters = useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', '1');
      // Mantener tab
      if (!params.has('tab')) params.set('tab', 'mora');
      for (const [key, val] of Object.entries(patch)) {
        if (val != null && val !== '') params.set(key, val);
        else params.delete(key);
      }
      updateUrl(params);
    }, [searchParams, updateUrl]
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout((window as any).__moraSearchTimeout);
    (window as any).__moraSearchTimeout = setTimeout(() => {
      applyFilters({ q: value.trim() || undefined });
    }, 400);
  };

  const handlePageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    updateUrl(params);
  }, [searchParams, updateUrl]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('size', String(newSize));
    params.set('page', '1');
    updateUrl(params);
  }, [searchParams, updateUrl]);

  const clearAllFilters = useCallback(() => {
    setSearch('');
    const params = new URLSearchParams();
    params.set('tab', 'mora');
    params.set('page', '1');
    params.set('size', searchParams.get('size') ?? '20');
    updateUrl(params);
  }, [searchParams, updateUrl]);

  return (
    <div className="space-y-4">
      {/* Buscador + Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nombre o DNI..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            disabled={isPending}
            className="pl-9 h-9"
          />
        </div>

        <NativeSelect
          value={searchParams.get('managementStatus') ?? ''}
          onChange={(e) => applyFilters({ managementStatus: e.target.value || undefined })}
          className="h-9 w-40"
          disabled={isPending}
        >
          <NativeSelectOption value="">Todos los estados</NativeSelectOption>
          <NativeSelectOption value="SENT">En negociación</NativeSelectOption>
          <NativeSelectOption value="ACCEPTED">Acuerdo firmado</NativeSelectOption>
          <NativeSelectOption value="REJECTED">Rechazado</NativeSelectOption>
          <NativeSelectOption value="EXPIRED">Expirado</NativeSelectOption>
        </NativeSelect>

        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleTrigger className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 h-9 gap-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" disabled={isPending}>
            <Filter className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge variant="default" className="h-5 min-w-5 px-1 text-[10px]">{activeFilterCount}</Badge>
            )}
            {filtersOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </CollapsibleTrigger>
        </Collapsible>

        {(activeFilterCount > 0 || search) && (
          <Button variant="ghost" size="sm" className="h-9 gap-1 text-xs" onClick={clearAllFilters} disabled={isPending}>
            <X className="h-3.5 w-3.5" /> Limpiar
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={() => startTransition(() => router.refresh())} disabled={isPending} className="h-9 ml-auto gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualizar
        </Button>
      </div>

      {/* Panel de filtros avanzados */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleContent>
          <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Ciudad (Dpto.)</Label>
                <NativeSelect
                  value={searchParams.get('city') ?? ''}
                  onChange={(e) => applyFilters({ city: e.target.value || undefined })}
                  className="h-8 text-sm" disabled={isPending}
                >
                  <NativeSelectOption value="">Todas</NativeSelectOption>
                  {getDepartments().map((d) => (
                    <NativeSelectOption key={d.code} value={d.code}>{d.name}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Días mora mínimo</Label>
                <NativeSelect
                  value={searchParams.get('minDaysOverdue') ?? ''}
                  onChange={(e) => applyFilters({ minDaysOverdue: e.target.value || undefined })}
                  className="h-8 text-sm" disabled={isPending}
                >
                  <NativeSelectOption value="">Todos</NativeSelectOption>
                  <NativeSelectOption value="1">1+ día</NativeSelectOption>
                  <NativeSelectOption value="3">3+ días</NativeSelectOption>
                  <NativeSelectOption value="7">7+ días</NativeSelectOption>
                  <NativeSelectOption value="15">15+ días</NativeSelectOption>
                  <NativeSelectOption value="30">30+ días</NativeSelectOption>
                  <NativeSelectOption value="60">60+ días</NativeSelectOption>
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Ordenar por</Label>
                <NativeSelect
                  value={searchParams.get('sortBy') ?? 'daysOverdue'}
                  onChange={(e) => applyFilters({ sortBy: e.target.value || undefined })}
                  className="h-8 text-sm" disabled={isPending}
                >
                  <NativeSelectOption value="daysOverdue">Días de mora</NativeSelectOption>
                  <NativeSelectOption value="pendingBalance">Saldo pendiente</NativeSelectOption>
                  <NativeSelectOption value="accruedPenalty">Mora acumulada</NativeSelectOption>
                  <NativeSelectOption value="clientName">Nombre</NativeSelectOption>
                </NativeSelect>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Tabla */}
      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        exportFileName="cobranza-mora.xlsx"
        getExportData={() => data}
        enableExport={true}
        isLoading={isPending}
        onRowClick={(row) => router.push(`/admin/credits/${row.creditId}`)}
      />
    </div>
  );
}
