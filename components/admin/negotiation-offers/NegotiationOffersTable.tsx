'use client';

import { useCallback, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type DataTableColumnDef, type DataTablePagination } from '@/components/admin/DataTable';
import { negotiationOfferStatusLabels } from '@/modules/negotiation-offers';
import type { NegotiationOffer } from '@/modules/negotiation-offers';

// ── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  SENT: 'secondary',
  ACCEPTED: 'default',
  REJECTED: 'destructive',
  EXPIRED: 'outline',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(value: number) {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
}

// ── Columns ─────────────────────────────────────────────────────────────────

const columns: DataTableColumnDef<NegotiationOffer>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <Link href={`/admin/negotiation-offers/${row.original.id}`} className="text-primary hover:underline font-mono text-xs">
        #{row.original.id.slice(0, 8)}
      </Link>
    ),
  },
  {
    accessorKey: 'clientName',
    header: 'Cliente',
    cell: ({ row }) => (
      <div>
        <p className="text-xs font-medium">{row.original.clientName || '—'}</p>
        {row.original.clientDocument && (
          <p className="text-[11px] text-muted-foreground font-mono">{row.original.clientDocument}</p>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'totalAmount',
    header: 'Monto',
    cell: ({ row }) => <span className="font-mono text-xs">{formatCurrency(row.original.totalAmount)}</span>,
  },
  {
    accessorKey: 'schedule',
    header: 'Cuotas',
    cell: ({ row }) => <span className="text-xs">{row.original.schedule.length}</span>,
  },
  {
    accessorKey: 'signDeadline',
    header: 'Plazo firma',
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.signDeadline)}</span>,
  },
  {
    accessorKey: 'createdAt',
    header: 'Creada',
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANT[row.original.status] ?? 'outline'} className="text-[10px]">
        {negotiationOfferStatusLabels[row.original.status]}
      </Badge>
    ),
  },
];

// ── Props ───────────────────────────────────────────────────────────────────

interface NegotiationOffersTableProps {
  offers: NegotiationOffer[];
  pagination: DataTablePagination;
  currentStatus: string;
}

// ── Component ───────────────────────────────────────────────────────────────

export function NegotiationOffersTable({ offers, pagination, currentStatus }: NegotiationOffersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateUrl = useCallback(
    (newParams: URLSearchParams) => {
      startTransition(() => {
        router.push(`/admin/negotiation-offers?${newParams.toString()}`);
      });
    },
    [router],
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

  const handleStatusChange = useCallback(
    (value: string | null) => {
      if (!value) return;
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all') {
        params.delete('status');
      } else {
        params.set('status', value);
      }
      params.set('page', '1');
      updateUrl(params);
    },
    [searchParams, updateUrl],
  );

  const handleRowClick = useCallback(
    (row: NegotiationOffer) => {
      router.push(`/admin/negotiation-offers/${row.id}`);
    },
    [router],
  );

  return (
    <div className="space-y-4">
      {/* Filtro de estado */}
      <div className="flex items-center gap-3">
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-9 w-44 text-sm">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="SENT">Pendientes</SelectItem>
            <SelectItem value="ACCEPTED">Aceptadas</SelectItem>
            <SelectItem value="REJECTED">Rechazadas</SelectItem>
            <SelectItem value="EXPIRED">Expiradas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={offers}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRowClick={handleRowClick}
        isLoading={isPending}
      />
    </div>
  );
}
