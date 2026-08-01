'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumnDef, type DataTablePagination } from '@/components/admin/DataTable';
import type { VerificationHistoryEntry, PageResponse } from '@/modules/admin';
import { FORM_STATUS_CONFIG } from './FormStatusCard';

interface FormVerificationHistoryProps {
  page: PageResponse<VerificationHistoryEntry>;
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString('es-PE') : '—';
}

/**
 * Secuencia histórica de verificaciones (VERIFIED/EXPIRED/REPLACED en el tiempo) — a diferencia de
 * FormStatusCard, que solo muestra el estado actual.
 */
export function FormVerificationHistory({ page }: FormVerificationHistoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pagination: DataTablePagination = {
    page: (page.number ?? 0) + 1,
    pageSize: page.size || 20,
    totalItems: page.totalElements ?? 0,
    totalPages: page.totalPages ?? 0,
  };

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('verificationsPage', String(newPage - 1));
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('verificationsSize', String(newSize));
      params.set('verificationsPage', '0');
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const columns: DataTableColumnDef<VerificationHistoryEntry>[] = [
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const cfg = FORM_STATUS_CONFIG[row.original.status] || { label: row.original.status, variant: 'secondary' };
        return <Badge variant={cfg.variant} className="text-[9px]">{cfg.label}</Badge>;
      },
    },
    {
      accessorKey: 'verifiedAt',
      header: 'Verificado el',
      cell: ({ row }) => <span className="text-xs whitespace-nowrap">{formatDate(row.original.verifiedAt)}</span>,
    },
    {
      accessorKey: 'expiresAt',
      header: 'Expira el',
      cell: ({ row }) => <span className="text-xs whitespace-nowrap">{formatDate(row.original.expiresAt)}</span>,
    },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-foreground">Historial de verificaciones ({pagination.totalItems})</h3>
      <DataTable
        columns={columns}
        data={page.content}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        enableExport={false}
        pageSizeOptions={[10, 20, 50]}
      />
    </div>
  );
}
