'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { DataTable, type DataTableColumnDef, type DataTablePagination } from '@/components/admin/DataTable';
import { paymentDeclarationStatusLabels } from '@/modules/payment-declarations';
import type { PaymentDeclaration } from '@/modules/payment-declarations';

// ── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  APPROVED: 'default',
  REJECTED: 'destructive',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(value: number) {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Columns ─────────────────────────────────────────────────────────────────

const columns: DataTableColumnDef<PaymentDeclaration>[] = [
  {
    accessorKey: 'createdAt',
    header: 'Fecha',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
        {formatDateTime(row.original.createdAt)}
      </span>
    ),
  },
  {
    accessorKey: 'creditId',
    header: 'Crédito',
    cell: ({ row }) => (
      <Link href={`/admin/credits/${row.original.creditId}`} className="text-primary hover:underline font-mono text-xs">
        #{row.original.creditId.slice(-6)}
      </Link>
    ),
  },
  {
    accessorKey: 'installmentNo',
    header: 'Cuota',
    cell: ({ row }) => <span className="text-xs">#{row.original.installmentNo}</span>,
  },
  {
    accessorKey: 'userId',
    header: 'Usuario',
    cell: ({ row }) => (
      <span className="font-mono text-[11px] text-muted-foreground">{row.original.userId.slice(-6)}</span>
    ),
  },
  {
    accessorKey: 'declaredAmount',
    header: 'Monto declarado',
    cell: ({ row }) => <span className="font-mono text-xs font-medium">{formatCurrency(row.original.declaredAmount)}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANT[row.original.status] ?? 'outline'} className="text-[10px]">
        {paymentDeclarationStatusLabels[row.original.status]}
      </Badge>
    ),
  },
  {
    accessorKey: 'vouchers',
    header: 'Comprobantes',
    cell: ({ row }) => <span className="text-xs">{row.original.vouchers.length}</span>,
  },
];

// ── Props ───────────────────────────────────────────────────────────────────

interface PaymentDeclarationsTableProps {
  data: PaymentDeclaration[];
  pagination: DataTablePagination;
  currentStatus: string;
  currentCreditId: string;
}

// ── Component ───────────────────────────────────────────────────────────────

export function PaymentDeclarationsTable({
  data,
  pagination,
  currentStatus,
  currentCreditId,
}: PaymentDeclarationsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [creditIdInput, setCreditIdInput] = useState(currentCreditId);

  const updateUrl = useCallback(
    (params: URLSearchParams) => {
      startTransition(() => {
        router.push(`/admin/payment-declarations?${params.toString()}`);
      });
    },
    [router],
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

  const applyCreditIdFilter = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();
      if (trimmed) params.set('creditId', trimmed);
      else params.delete('creditId');
      params.set('page', '1');
      updateUrl(params);
    },
    [searchParams, updateUrl],
  );

  const clearCreditIdFilter = useCallback(() => {
    setCreditIdInput('');
    applyCreditIdFilter('');
  }, [applyCreditIdFilter]);

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

  const handleRowClick = useCallback(
    (row: PaymentDeclaration) => {
      router.push(`/admin/payment-declarations/${row.id}`);
    },
    [router],
  );

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-9 w-44 text-sm">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="PENDING">Pendientes</SelectItem>
            <SelectItem value="APPROVED">Aprobadas</SelectItem>
            <SelectItem value="REJECTED">Rechazadas</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ID de crédito (UUID)"
            value={creditIdInput}
            onChange={(e) => setCreditIdInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyCreditIdFilter(creditIdInput);
            }}
            className="pl-9 h-9"
            disabled={isPending}
          />
        </div>
        <Button variant="outline" size="sm" className="h-9" onClick={() => applyCreditIdFilter(creditIdInput)} disabled={isPending}>
          Buscar
        </Button>
        {currentCreditId && (
          <Button variant="ghost" size="sm" className="h-9 gap-1 text-xs" onClick={clearCreditIdFilter} disabled={isPending}>
            <X className="h-3.5 w-3.5" /> Limpiar
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRowClick={handleRowClick}
        isLoading={isPending}
        enableExport={false}
      />
    </div>
  );
}
