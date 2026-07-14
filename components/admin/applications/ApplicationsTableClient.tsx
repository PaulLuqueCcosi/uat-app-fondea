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
import type { AdminApplicationRow, ApplicationStatus } from '@/modules/admin/admin-applications.service';

// ── Status labels ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; bg: string; text: string; border: string }> = {
  SUBMITTED: { label: 'Enviada', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  PROCESSING: { label: 'Evaluando', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  PRE_APPROVED: { label: 'Pre-aprobada', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  APPROVED: { label: 'Aprobada', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  REJECTED: { label: 'Rechazada', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  REJECTED_BY_USER: { label: 'Rechazada (usr)', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  FAILED: { label: 'Fallida', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  BLOCKED: { label: 'Bloqueada', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  EXPIRED: { label: 'Expirada', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

// ── Columnas ───────────────────────────────────────────────────────────────

const columns = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }: { row: { original: AdminApplicationRow } }) => (
      <Link
        href={`/admin/applications/${row.original.id}`}
        className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
      >
        {row.original.id.slice(0, 8)}…
      </Link>
    ),
  },
  {
    accessorKey: 'userName',
    header: 'Usuario',
    cell: ({ row }: { row: { original: AdminApplicationRow } }) => (
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
    cell: ({ row }: { row: { original: AdminApplicationRow } }) => {
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
    accessorKey: 'submittedAt',
    header: 'Enviada',
    cell: ({ row }: { row: { original: AdminApplicationRow } }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.submittedAt
          ? new Date(row.original.submittedAt).toLocaleDateString('es-PE')
          : '—'}
      </span>
    ),
  },
  {
    accessorKey: 'evaluatedAt',
    header: 'Evaluada',
    cell: ({ row }: { row: { original: AdminApplicationRow } }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.evaluatedAt
          ? new Date(row.original.evaluatedAt).toLocaleDateString('es-PE')
          : '—'}
      </span>
    ),
  },
  {
    accessorKey: 'creditScore',
    header: 'Score',
    cell: ({ row }: { row: { original: AdminApplicationRow } }) => (
      <span className="text-xs font-medium">
        {row.original.creditScore ?? '—'}
      </span>
    ),
  },
  {
    accessorKey: 'rejectionReason',
    header: 'Razón',
    cell: ({ row }: { row: { original: AdminApplicationRow } }) => (
      <span className="text-xs text-muted-foreground truncate max-w-[200px] block" title={row.original.rejectionReason ?? undefined}>
        {row.original.rejectionReason ?? '—'}
      </span>
    ),
  },
];

// ── Componente ─────────────────────────────────────────────────────────────

interface ApplicationsTableClientProps {
  data: AdminApplicationRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export function ApplicationsTableClient({ data, pagination }: ApplicationsTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [isPending, startTransition] = useTransition();

  // Panel colapsable de filtros avanzados
  const [filtersOpen, setFiltersOpen] = useState(() => {
    const hasAdv =
      searchParams.get('submitted_from') ||
      searchParams.get('submitted_to') ||
      searchParams.get('score_min') ||
      searchParams.get('score_max');
    return !!hasAdv;
  });

  // Contar filtros avanzados activos
  const activeFilterCount = [
    searchParams.get('submitted_from'),
    searchParams.get('submitted_to'),
    searchParams.get('score_min'),
    searchParams.get('score_max'),
  ].filter(Boolean).length;

  /** Actualiza la URL con los parámetros actuales */
  const updateUrl = useCallback(
    (params: URLSearchParams) => {
      startTransition(() => {
        router.push(`/admin/applications?${params.toString()}`);
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
    clearTimeout((window as any).__adminAppSearchTimeout);
    (window as any).__adminAppSearchTimeout = setTimeout(() => {
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
            <NativeSelectOption value="SUBMITTED">Enviada</NativeSelectOption>
            <NativeSelectOption value="PROCESSING">Evaluando</NativeSelectOption>
            <NativeSelectOption value="PRE_APPROVED">Pre-aprobada</NativeSelectOption>
            <NativeSelectOption value="APPROVED">Aprobada</NativeSelectOption>
            <NativeSelectOption value="REJECTED">Rechazada</NativeSelectOption>
            <NativeSelectOption value="FAILED">Fallida</NativeSelectOption>
            <NativeSelectOption value="BLOCKED">Bloqueada</NativeSelectOption>
            <NativeSelectOption value="EXPIRED">Expirada</NativeSelectOption>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Fecha envío desde */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Enviada desde</Label>
                <Input
                  type="date"
                  defaultValue={searchParams.get('submitted_from')?.split('T')[0] ?? ''}
                  className="h-8 text-sm"
                  disabled={isPending}
                  onChange={(e) => {
                    const val = e.target.value;
                    applyFilters({ submitted_from: val ? `${val}T00:00:00` : undefined });
                  }}
                />
              </div>

              {/* Fecha envío hasta */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Enviada hasta</Label>
                <Input
                  type="date"
                  defaultValue={searchParams.get('submitted_to')?.split('T')[0] ?? ''}
                  className="h-8 text-sm"
                  disabled={isPending}
                  onChange={(e) => {
                    const val = e.target.value;
                    applyFilters({ submitted_to: val ? `${val}T23:59:59` : undefined });
                  }}
                />
              </div>

              {/* Score mínimo */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Score mínimo</Label>
                <Input
                  type="number"
                  min={0}
                  max={1000}
                  placeholder="Ej: 500"
                  defaultValue={searchParams.get('score_min') ?? ''}
                  className="h-8 text-sm"
                  disabled={isPending}
                  onBlur={(e) => applyFilters({ score_min: e.target.value || undefined })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      applyFilters({ score_min: (e.target as HTMLInputElement).value || undefined });
                    }
                  }}
                />
              </div>

              {/* Score máximo */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Score máximo</Label>
                <Input
                  type="number"
                  min={0}
                  max={1000}
                  placeholder="Ej: 800"
                  defaultValue={searchParams.get('score_max') ?? ''}
                  className="h-8 text-sm"
                  disabled={isPending}
                  onBlur={(e) => applyFilters({ score_max: e.target.value || undefined })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      applyFilters({ score_max: (e.target as HTMLInputElement).value || undefined });
                    }
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
        onPageSizeChange={handlePageSizeChange}
        exportFileName="solicitudes.xlsx"
        getExportData={() => data}
        enableExport={true}
        exportFilterLabel={search || currentStatus || undefined}
        isLoading={isPending}
        onRowClick={(row) => {
          router.push(`/admin/applications/${row.id}`);
        }}
      />
    </div>
  );
}
