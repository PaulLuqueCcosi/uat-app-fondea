'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  Search, RefreshCw, Loader2, AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import type { AdminComplaintRow } from '@/modules/admin/admin-complaints.types';
import {
  getCountdownColor,
  getStatusStyle,
  COMPLAINT_TYPE_LABELS,
} from '@/modules/admin/admin-complaints.types';

// ── Columnas ─────────────────────────────────────────────────────────────────

const columns = [
  {
    accessorKey: 'correlativeNumber',
    header: '#',
    cell: ({ row }: { row: { original: AdminComplaintRow } }) => (
      <span className="font-mono text-xs font-semibold">
        #{String(row.original.correlativeNumber).padStart(2, '0')}
      </span>
    ),
  },
  {
    accessorKey: 'clientName',
    header: 'Cliente',
    cell: ({ row }: { row: { original: AdminComplaintRow } }) => (
      <div className="flex flex-col gap-0.5 min-w-0">
        <Link
          href={`/admin/complaints/${row.original.id}`}
          className="text-sm font-medium hover:text-primary truncate max-w-[150px]"
        >
          {row.original.clientName}
        </Link>
        <span className="font-mono text-[10px] text-muted-foreground">{row.original.clientDocument}</span>
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }: { row: { original: AdminComplaintRow } }) => (
      <span className="text-xs">{COMPLAINT_TYPE_LABELS[row.original.type]}</span>
    ),
  },
  {
    accessorKey: 'productServiceDetail',
    header: 'Detalle',
    cell: ({ row }: { row: { original: AdminComplaintRow } }) => (
      <span className="text-xs text-muted-foreground truncate max-w-[180px] block">
        {row.original.productServiceDetail}
      </span>
    ),
  },
  {
    accessorKey: 'submittedDate',
    header: 'Ingresado',
    cell: ({ row }: { row: { original: AdminComplaintRow } }) => (
      <span className="text-[11px] text-muted-foreground">
        {new Date(row.original.submittedDate + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
      </span>
    ),
  },
  {
    accessorKey: 'businessDaysElapsed',
    header: 'Días háb. transcurridos',
    cell: ({ row }: { row: { original: AdminComplaintRow } }) => (
      <span className="text-xs font-mono">{row.original.businessDaysElapsed}</span>
    ),
  },
  {
    accessorKey: 'businessDaysRemaining',
    header: 'Días háb. restantes',
    cell: ({ row }: { row: { original: AdminComplaintRow } }) => {
      const { businessDaysRemaining, isOverdue } = row.original;
      const colors = getCountdownColor(businessDaysRemaining, isOverdue);
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
          {isOverdue && <AlertTriangle className="h-3 w-3" />}
          {businessDaysRemaining < 0 ? `${Math.abs(businessDaysRemaining)}d vencido` : `${businessDaysRemaining}d`}
        </span>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }: { row: { original: AdminComplaintRow } }) => {
      const style = getStatusStyle(row.original.status);
      return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${style.bg} ${style.text} ${style.border}`}>
          {style.label}
        </span>
      );
    },
  },
];

// ── Componente ───────────────────────────────────────────────────────────────

interface ComplaintsTableProps {
  data: AdminComplaintRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export function ComplaintsTable({ data, pagination }: ComplaintsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateUrl = useCallback(
    (params: URLSearchParams) => {
      startTransition(() => { router.push(`/admin/complaints?${params.toString()}`); });
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

  const overdueCount = data.filter((r) => r.isOverdue).length;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <NativeSelect
          value={searchParams.get('status') ?? ''}
          onChange={(e) => applyFilters({ status: e.target.value || undefined })}
          className="h-9 w-36"
          disabled={isPending}
        >
          <NativeSelectOption value="">Todos los estados</NativeSelectOption>
          <NativeSelectOption value="REGISTRADO">Registrado</NativeSelectOption>
          <NativeSelectOption value="EN_REVISION">En revisión</NativeSelectOption>
          <NativeSelectOption value="RESPONDIDO">Respondido</NativeSelectOption>
        </NativeSelect>

        <NativeSelect
          value={searchParams.get('type') ?? ''}
          onChange={(e) => applyFilters({ type: e.target.value || undefined })}
          className="h-9 w-32"
          disabled={isPending}
        >
          <NativeSelectOption value="">Todos los tipos</NativeSelectOption>
          <NativeSelectOption value="RECLAMO">Reclamo</NativeSelectOption>
          <NativeSelectOption value="QUEJA">Queja</NativeSelectOption>
        </NativeSelect>

        <NativeSelect
          value={searchParams.get('onlyOverdue') ?? ''}
          onChange={(e) => applyFilters({ onlyOverdue: e.target.value || undefined })}
          className="h-9 w-36"
          disabled={isPending}
        >
          <NativeSelectOption value="">Todos</NativeSelectOption>
          <NativeSelectOption value="true">Solo vencidos</NativeSelectOption>
        </NativeSelect>

        {overdueCount > 0 && (
          <Badge variant="destructive" className="text-[10px]">
            {overdueCount} vencido{overdueCount > 1 ? 's' : ''}
          </Badge>
        )}

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
        exportFileName="reclamaciones.xlsx"
        getExportData={() => data}
        enableExport={true}
        isLoading={isPending}
        onRowClick={(row) => router.push(`/admin/complaints/${row.id}`)}
      />
    </div>
  );
}
