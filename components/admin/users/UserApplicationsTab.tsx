'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumnDef, type DataTablePagination } from '@/components/admin/DataTable';
import type { AdminApplicationRow, ApplicationStatus } from '@/modules/admin/admin-applications.service';

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'secondary' }> = {
  SUBMITTED: { label: 'Enviada', variant: 'secondary' },
  PROCESSING: { label: 'Evaluando', variant: 'warning' },
  PRE_APPROVED: { label: 'Pre-aprobada', variant: 'success' },
  APPROVED: { label: 'Aprobada', variant: 'success' },
  REJECTED: { label: 'Rechazada', variant: 'error' },
  REJECTED_BY_USER: { label: 'Rechazada (usuario)', variant: 'secondary' },
  BLOCKED: { label: 'Bloqueada', variant: 'error' },
  FAILED: { label: 'Fallida', variant: 'error' },
  EXPIRED: { label: 'Expirada', variant: 'secondary' },
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

const columns: DataTableColumnDef<AdminApplicationRow>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <Link
        href={`/admin/applications/${row.original.id}`}
        onClick={(e) => e.stopPropagation()}
        className="font-mono text-xs text-primary hover:underline"
      >
        {row.original.id.slice(0, 8)}…
      </Link>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const cfg = STATUS_CONFIG[row.original.status];
      return <Badge variant={cfg?.variant ?? 'secondary'} className="text-[10px]">{cfg?.label ?? row.original.status}</Badge>;
    },
  },
  {
    accessorKey: 'creditScore',
    header: 'Score',
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.creditScore ?? '—'}</span>,
  },
  {
    accessorKey: 'submittedAt',
    header: 'Enviada',
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.submittedAt)}</span>,
  },
  {
    accessorKey: 'evaluatedAt',
    header: 'Evaluada',
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.evaluatedAt)}</span>,
  },
  {
    accessorKey: 'rejectionReason',
    header: 'Razón de rechazo',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground truncate max-w-[220px] block" title={row.original.rejectionReason ?? undefined}>
        {row.original.rejectionReason ?? '—'}
      </span>
    ),
  },
];

interface UserApplicationsTabProps {
  userId: string;
  applications: AdminApplicationRow[];
  pagination: DataTablePagination;
}

export function UserApplicationsTab({ userId, applications, pagination }: UserApplicationsTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateUrl = useCallback(
    (params: URLSearchParams) => {
      router.push(`/admin/users/${userId}/solicitudes?${params.toString()}`);
    },
    [router, userId],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(newPage));
      updateUrl(params);
    },
    [searchParams, updateUrl],
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('size', String(newSize));
      params.set('page', '1');
      updateUrl(params);
    },
    [searchParams, updateUrl],
  );

  return (
    <DataTable
      columns={columns}
      data={applications}
      pagination={pagination}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      exportFileName={`solicitudes-${userId.slice(0, 8)}.xlsx`}
      getExportData={() => applications}
      enableExport
      onRowClick={(row) => router.push(`/admin/applications/${row.id}`)}
    />
  );
}
