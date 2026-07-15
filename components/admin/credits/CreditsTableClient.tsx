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
import Link from 'next/link';
import type { AdminCreditRow, CreditStatus } from '@/modules/admin/admin-credits.service';

// ── Status labels ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<CreditStatus, { label: string; bg: string; text: string; border: string }> = {
  ACTIVE: { label: 'Activo', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  OVERDUE: { label: 'Vencido', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  DEFAULTED: { label: 'En mora', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  PAID_OFF: { label: 'Liquidado', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

// ── Columnas ───────────────────────────────────────────────────────────────

const columns = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }: { row: { original: AdminCreditRow } }) => (
      <Link
        href={`/admin/credits/${row.original.id}`}
        className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
      >
        {row.original.id.slice(0, 8)}…
      </Link>
    ),
  },
  {
    accessorKey: 'userName',
    header: 'Usuario',
    cell: ({ row }: { row: { original: AdminCreditRow } }) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-sm text-foreground">
          {row.original.userName ?? '—'}
        </span>
        {row.original.userDocument && (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.userDocument}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }: { row: { original: AdminCreditRow } }) => {
      const cfg = STATUS_CONFIG[row.original.status];
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
        >
          {cfg.label}
        </span>
      );
    },
  },
  {
    accessorKey: 'principal',
    header: 'Capital',
    cell: ({ row }: { row: { original: AdminCreditRow } }) => (
      <span className="text-xs font-medium">
        S/ {row.original.principal.toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: 'totalDue',
    header: 'Total a pagar',
    cell: ({ row }: { row: { original: AdminCreditRow } }) => (
      <span className="text-xs font-medium">
        S/ {row.original.totalDue.toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: 'installmentCount',
    header: 'Cuotas',
    cell: ({ row }: { row: { original: AdminCreditRow } }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.installmentCount}
      </span>
    ),
  },
  {
    accessorKey: 'disbursedAt',
    header: 'Desembolso',
    cell: ({ row }: { row: { original: AdminCreditRow } }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.disbursedAt
          ? new Date(row.original.disbursedAt).toLocaleDateString('es-PE')
          : '—'}
      </span>
    ),
  },
  {
    accessorKey: 'maturityDate',
    header: 'Vencimiento',
    cell: ({ row }: { row: { original: AdminCreditRow } }) => (
      <span className="text-xs text-muted-foreground">
        {new Date(row.original.maturityDate).toLocaleDateString('es-PE')}
      </span>
    ),
  },
  {
    accessorKey: 'overdueSince',
    header: 'Mora desde',
    cell: ({ row }: { row: { original: AdminCreditRow } }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.overdueSince
          ? new Date(row.original.overdueSince).toLocaleDateString('es-PE')
          : '—'}
      </span>
    ),
  },
];

// ── Componente ─────────────────────────────────────────────────────────────

interface CreditsTableClientProps {
  data: AdminCreditRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export function CreditsTableClient({ data, pagination }: CreditsTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [isPending, startTransition] = useTransition();

  const [filtersOpen, setFiltersOpen] = useState(() => {
    const hasAdv =
      searchParams.get('disbursed_from') ||
      searchParams.get('disbursed_to') ||
      searchParams.get('overdue_only');
    return !!hasAdv;
  });

  const activeFilterCount = [
    searchParams.get('disbursed_from'),
    searchParams.get('disbursed_to'),
    searchParams.get('overdue_only'),
  ].filter(Boolean).length;

  const updateUrl = useCallback(
    (params: URLSearchParams) => {
      startTransition(() => {
        router.push(`/admin/credits?${params.toString()}`);
      });
    },
    [router]
  );

  const applyFilters = useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', '1');

      for (const [key, val] of Object.entries(patch)) {
        if (val != null && val !== '') {
          params.set(key, val);
        } else {
          params.delete(key);
        }
      }
      updateUrl(params);
    },
    [searchParams, updateUrl]
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout((window as any).__adminCreditSearchTimeout);
    (window as any).__adminCreditSearchTimeout = setTimeout(() => {
      applyFilters({ q: value.trim() || undefined });
    }, 400);
  };

  const handleStatusChange = (value: string) => {
    applyFilters({ status: value || undefined });
  };

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(newPage));
      updateUrl(params);
    },
    [searchParams, updateUrl]
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('size', String(newSize));
      params.set('page', '1');
      updateUrl(params);
    },
    [searchParams, updateUrl]
  );

  const clearAllFilters = useCallback(() => {
    setSearch('');
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('size', searchParams.get('size') ?? '10');
    updateUrl(params);
  }, [searchParams, updateUrl]);

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const currentStatus = searchParams.get('status') ?? '';

  return (
    <div className="space-y-4">
      {/* ── Buscador global ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o documento..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            disabled={isPending}
            className="pl-9 h-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
          className="h-9 gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Actualizar
        </Button>
      </div>

      {/* ── Barra: estado + filtros + limpiar ── */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <div className="flex items-center gap-3 flex-wrap">
          <NativeSelect
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-9 w-40"
            disabled={isPending}
          >
            <NativeSelectOption value="">Todos los estados</NativeSelectOption>
            <NativeSelectOption value="ACTIVE">Activo</NativeSelectOption>
            <NativeSelectOption value="OVERDUE">Vencido</NativeSelectOption>
            <NativeSelectOption value="DEFAULTED">En mora</NativeSelectOption>
            <NativeSelectOption value="PAID_OFF">Liquidado</NativeSelectOption>
          </NativeSelect>

          <CollapsibleTrigger>
            <Button variant="outline" size="sm" className="h-9 gap-2" type="button" disabled={isPending}>
              <Filter className="h-4 w-4" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge variant="default" className="h-5 min-w-5 px-1 text-[10px]">{activeFilterCount}</Badge>
              )}
              {filtersOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>

          {(activeFilterCount > 0 || currentStatus || search) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1 text-xs text-muted-foreground"
              onClick={clearAllFilters}
              disabled={isPending}
            >
              <X className="h-3.5 w-3.5" /> Limpiar filtros
            </Button>
          )}
        </div>

        {/* ── Panel de filtros avanzados ── */}
        <CollapsibleContent>
          <div className="rounded-lg border bg-muted/30 p-4 space-y-4 mt-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Fecha desembolso desde */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Desembolsado desde</Label>
                <Input
                  type="date"
                  defaultValue={searchParams.get('disbursed_from') ?? ''}
                  className="h-8 text-sm"
                  disabled={isPending}
                  onChange={(e) => {
                    const val = e.target.value;
                    applyFilters({ disbursed_from: val || undefined });
                  }}
                />
              </div>

              {/* Fecha desembolso hasta */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Desembolsado hasta</Label>
                <Input
                  type="date"
                  defaultValue={searchParams.get('disbursed_to') ?? ''}
                  className="h-8 text-sm"
                  disabled={isPending}
                  onChange={(e) => {
                    const val = e.target.value;
                    applyFilters({ disbursed_to: val || undefined });
                  }}
                />
              </div>

              {/* Solo en mora */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Solo en mora</Label>
                <NativeSelect
                  value={searchParams.get('overdue_only') ?? ''}
                  onChange={(e) => applyFilters({ overdue_only: e.target.value || undefined })}
                  className="h-8 text-sm"
                  disabled={isPending}
                >
                  <NativeSelectOption value="">Todos</NativeSelectOption>
                  <NativeSelectOption value="true">Solo en mora</NativeSelectOption>
                </NativeSelect>
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
        onPageSizeChange={handlePageSizeChange}
        exportFileName="creditos.xlsx"
        getExportData={() => data}
        enableExport={true}
        exportFilterLabel={search || currentStatus || undefined}
        isLoading={isPending}
        onRowClick={(row) => {
          router.push(`/admin/credits/${row.id}`);
        }}
      />
    </div>
  );
}
