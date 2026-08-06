'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { RefreshCw, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import type { ChurnRiskRow } from '@/modules/admin/admin-customers.types';

// ── Passport badge ───────────────────────────────────────────────────────────

function getPassportBadge(level: string | null): { label: string; className: string } {
  switch (level) {
    case 'MASTER': return { label: 'Master', className: 'text-purple-700 bg-purple-50' };
    case 'ORO': return { label: 'Oro', className: 'text-yellow-700 bg-yellow-50' };
    case 'PLATA': return { label: 'Plata', className: 'text-gray-600 bg-gray-100' };
    case 'BRONCE': return { label: 'Bronce', className: 'text-amber-700 bg-amber-50' };
    default: return { label: 'Sin nivel', className: 'text-muted-foreground bg-muted' };
  }
}

// ── Days inactive color ──────────────────────────────────────────────────────

function getDaysColor(days: number): string {
  if (days >= 50) return 'text-red-600 font-bold';
  if (days >= 40) return 'text-orange-600 font-semibold';
  return 'text-amber-600';
}

// ── Columnas ─────────────────────────────────────────────────────────────────

const columns = [
  {
    accessorKey: 'clientName',
    header: 'Cliente',
    cell: ({ row }: { row: { original: ChurnRiskRow } }) => (
      <div className="flex flex-col gap-0.5 min-w-0">
        <Link
          href={`/admin/users/${row.original.userId}`}
          className="text-sm font-medium hover:text-primary truncate max-w-[160px]"
        >
          {row.original.clientName ?? 'Sin nombre'}
        </Link>
        <span className="font-mono text-[10px] text-muted-foreground">
          {row.original.clientDocument}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'passportLevel',
    header: 'Nivel Pasaporte',
    cell: ({ row }: { row: { original: ChurnRiskRow } }) => {
      const badge = getPassportBadge(row.original.passportLevel);
      return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${badge.className}`}>
          {badge.label}
        </span>
      );
    },
  },
  {
    accessorKey: 'daysInactive',
    header: 'Días inactivo',
    cell: ({ row }: { row: { original: ChurnRiskRow } }) => (
      <span className={`text-xs font-mono ${getDaysColor(row.original.daysInactive)}`}>
        {row.original.daysInactive}d
      </span>
    ),
  },
  {
    accessorKey: 'lastCreditClosedAt',
    header: 'Último crédito pagado',
    cell: ({ row }: { row: { original: ChurnRiskRow } }) => {
      const date = row.original.lastCreditClosedAt;
      if (!date) return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <span className="text-[11px] text-muted-foreground">
          {new Date(date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      );
    },
  },
  {
    accessorKey: 'actions',
    header: '',
    cell: ({ row }: { row: { original: ChurnRiskRow } }) => (
      <Link
        href={`/admin/users/${row.original.userId}`}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <User className="h-3 w-3" />
        Ver perfil
      </Link>
    ),
  },
];

// ── Componente ───────────────────────────────────────────────────────────────

interface ChurnRiskTableProps {
  data: ChurnRiskRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export function ChurnRiskTable({ data, pagination }: ChurnRiskTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateUrl = useCallback(
    (params: URLSearchParams) => {
      startTransition(() => { router.push(`/admin/customers/churn?${params.toString()}`); });
    }, [router]
  );

  const applyFilters = useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', '1');
      for (const [key, val] of Object.entries(patch)) {
        if (val != null && val !== '') params.set(key, val);
        else params.delete(key);
      }
      updateUrl(params);
    }, [searchParams, updateUrl]
  );

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

  return (
    <div className="space-y-4">
      {/* Filtros de ventana de inactividad */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Inactivo desde</Label>
          <NativeSelect
            value={searchParams.get('minDays') ?? '30'}
            onChange={(e) => applyFilters({ minDays: e.target.value })}
            className="h-9 w-24"
            disabled={isPending}
          >
            <NativeSelectOption value="15">15 días</NativeSelectOption>
            <NativeSelectOption value="30">30 días</NativeSelectOption>
            <NativeSelectOption value="45">45 días</NativeSelectOption>
            <NativeSelectOption value="60">60 días</NativeSelectOption>
          </NativeSelect>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">hasta</Label>
          <NativeSelect
            value={searchParams.get('maxDays') ?? '60'}
            onChange={(e) => applyFilters({ maxDays: e.target.value })}
            className="h-9 w-24"
            disabled={isPending}
          >
            <NativeSelectOption value="45">45 días</NativeSelectOption>
            <NativeSelectOption value="60">60 días</NativeSelectOption>
            <NativeSelectOption value="90">90 días</NativeSelectOption>
            <NativeSelectOption value="120">120 días</NativeSelectOption>
          </NativeSelect>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => startTransition(() => router.refresh())}
          disabled={isPending}
          className="h-9 ml-auto gap-2"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualizar
        </Button>
      </div>

      {/* Tabla */}
      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        exportFileName="churn-risk.xlsx"
        getExportData={() => data}
        enableExport={true}
        isLoading={isPending}
        onRowClick={(row) => router.push(`/admin/users/${row.userId}`)}
      />
    </div>
  );
}
