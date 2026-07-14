'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/admin/DataTable';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  Search,
  RefreshCw,
  Loader2,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import type { AnonymousIntention } from '@/modules/admin/admin-intentions.service';

export interface AnonymousIntentionFilters {
  from?: string;
  to?: string;
  amountMin?: string;
  amountMax?: string;
  termDays?: string;
  installmentCount?: string;
  clientIp?: string;
}

interface AnonymousIntentionsTabProps {
  data: AnonymousIntention[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
  currentFilters: AnonymousIntentionFilters;
}

export function AnonymousIntentionsTab({ data, pagination, currentFilters }: AnonymousIntentionsTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchInput, setSearchInput] = useState(currentFilters.clientIp ?? '');

  const [filtersOpen, setFiltersOpen] = useState(() => {
    const { clientIp, ...rest } = currentFilters;
    return Object.values(rest).some((v) => v != null && v !== '');
  });

  const { clientIp: _clientIp, ...restFilters } = currentFilters;
  const activeFilterCount = Object.values(restFilters).filter(
    (v) => v != null && v !== ''
  ).length;

  const columns: ColumnDef<AnonymousIntention, any>[] = [
    {
      accessorKey: 'amount',
      header: () => <span className="text-right block">Monto</span>,
      cell: ({ row }) => (
        <span className="text-right block font-mono text-xs">
          S/ {Number(row.original.amount).toLocaleString()}
        </span>
      ),
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
      accessorKey: 'selectedRangeCode',
      header: 'Rango',
      cell: ({ row }) =>
        row.original.selectedRangeCode ? (
          <span className="text-xs font-medium">{row.original.selectedRangeCode}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'clientIp',
      header: 'IP',
      cell: ({ row }) => (
        <span className="font-mono text-[10px] text-muted-foreground">
          {row.original.clientIp ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleString('es-PE')}
        </span>
      ),
    },
  ];

  const applyFilters = (newFilters: Partial<AnonymousIntentionFilters>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has('tab')) params.set('tab', 'landing');
    params.set('lpage', '1');

    const merged = { ...currentFilters, ...newFilters };
    const filterKeys: (keyof AnonymousIntentionFilters)[] = [
      'from', 'to', 'amountMin', 'amountMax', 'termDays', 'installmentCount', 'clientIp',
    ];
    for (const key of filterKeys) {
      const val = merged[key];
      if (val != null && val !== '') {
        params.set(key, val);
      } else {
        params.delete(key);
      }
    }

    startTransition(() => {
      router.push(`/admin/intentions?${params.toString()}`);
    });
  };

  const handleSearch = (value: string) => {
    setSearchInput(value);
    clearTimeout((window as any).__landingSearchTimeout);
    (window as any).__landingSearchTimeout = setTimeout(() => {
      applyFilters({ clientIp: value.trim() || undefined });
    }, 400);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    const params = new URLSearchParams();
    params.set('tab', 'landing');
    params.set('lpage', '1');
    startTransition(() => {
      router.push(`/admin/intentions?${params.toString()}`);
    });
  };

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('lpage', String(newPage));
      startTransition(() => {
        router.push(`/admin/intentions?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('lsize', String(newSize));
      params.set('lpage', '1');
      startTransition(() => {
        router.push(`/admin/intentions?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const buildExportFilterLabel = (): string | undefined => {
    const parts: string[] = [];
    if (currentFilters.clientIp) {
      parts.push(`IP: ${currentFilters.clientIp}`);
    }
    if (currentFilters.amountMin || currentFilters.amountMax) {
      const min = currentFilters.amountMin ? `S/ ${currentFilters.amountMin}` : '';
      const max = currentFilters.amountMax ? `S/ ${currentFilters.amountMax}` : '';
      parts.push(`Monto: ${min}${min && max ? ' - ' : ''}${max}`);
    }
    if (currentFilters.termDays) {
      parts.push(`Plazo: ${currentFilters.termDays} días`);
    }
    if (currentFilters.installmentCount) {
      parts.push(`Cuotas: ${currentFilters.installmentCount}`);
    }
    if (currentFilters.from || currentFilters.to) {
      const from = currentFilters.from ? new Date(currentFilters.from).toLocaleDateString('es-PE') : '';
      const to = currentFilters.to ? new Date(currentFilters.to).toLocaleDateString('es-PE') : '';
      parts.push(`Fecha: ${from}${from && to ? ' - ' : ''}${to}`);
    }
    return parts.length > 0 ? parts.join(', ') : undefined;
  };

  return (
    <div className="space-y-4">
      {/* ── Buscador global por IP ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por IP..."
            value={searchInput}
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

      {/* ── Barra de filtros ── */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <div className="flex items-center gap-3 flex-wrap">
          <CollapsibleTrigger>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              type="button"
              disabled={isPending}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge variant="default" className="h-5 min-w-5 px-1 text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
              {filtersOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </CollapsibleTrigger>

          {activeFilterCount > 0 && (
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

        <CollapsibleContent>
          <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Monto mínimo */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Monto mínimo</Label>
                <Input
                  type="number"
                  placeholder="Ej: 1000"
                  defaultValue={currentFilters.amountMin ?? ''}
                  className="h-8 text-sm"
                  disabled={isPending}
                  onBlur={(e) => applyFilters({ amountMin: e.target.value || undefined })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') applyFilters({ amountMin: (e.target as HTMLInputElement).value || undefined });
                  }}
                />
              </div>
              {/* Monto máximo */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Monto máximo</Label>
                <Input
                  type="number"
                  placeholder="Ej: 10000"
                  defaultValue={currentFilters.amountMax ?? ''}
                  className="h-8 text-sm"
                  disabled={isPending}
                  onBlur={(e) => applyFilters({ amountMax: e.target.value || undefined })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') applyFilters({ amountMax: (e.target as HTMLInputElement).value || undefined });
                  }}
                />
              </div>
              {/* Plazo */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Plazo (días)</Label>
                <NativeSelect
                  value={currentFilters.termDays ?? ''}
                  onChange={(e) => applyFilters({ termDays: e.target.value || undefined })}
                  className="h-8 text-sm"
                  disabled={isPending}
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
                  disabled={isPending}
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
              {/* Fecha desde */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Desde</Label>
                <Input
                  type="date"
                  defaultValue={currentFilters.from?.split('T')[0] ?? ''}
                  className="h-8 text-sm"
                  disabled={isPending}
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
                  disabled={isPending}
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
        onPageSizeChange={handlePageSizeChange}
        enableExport={true}
        exportFileName="intenciones-landing.xlsx"
        getExportData={() => data}
        exportFilterLabel={buildExportFilterLabel()}
        isLoading={isPending}
        onRowClick={(row) => {
          router.push(`/admin/lifecycle/${row.id}`);
        }}
      />
    </div>
  );
}
