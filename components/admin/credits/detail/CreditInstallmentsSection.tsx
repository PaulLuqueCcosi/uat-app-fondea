'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumnDef } from '@/components/admin/DataTable';
import { Handshake, ExternalLink } from 'lucide-react';
import type { AdminCreditInstallments, InstallmentItem } from '@/modules/admin/admin-credit-detail.service';

interface Props {
  data: AdminCreditInstallments;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pendiente', variant: 'outline' },
  CURRENT: { label: 'Vigente', variant: 'default' },
  PARTIALLY_PAID: { label: 'Parcial', variant: 'secondary' },
  PAID: { label: 'Pagada', variant: 'default' },
  OVERDUE: { label: 'Vencida', variant: 'destructive' },
  NEGOTIATED: { label: 'Refinanciada', variant: 'secondary' },
};

const MIN_DAYS_OVERDUE_FOR_NEGOTIATION = 5;

function formatCurrency(value: number) {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

function formatDate(value: string) {
  const d = new Date(value + (value.includes('T') ? '' : 'T00:00:00'));
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

export function CreditInstallmentsSection({ data }: Props) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const paidCount = data.installments.filter((i) => i.status === 'PAID').length;
  const overdueCount = data.installments.filter((i) => i.status === 'OVERDUE').length;
  const totalOutstanding = data.installments.reduce((sum, i) => sum + i.outstanding, 0);

  const totalPages = Math.max(1, Math.ceil(data.installments.length / pageSize));
  const pageData = useMemo(
    () => data.installments.slice((page - 1) * pageSize, page * pageSize),
    [data.installments, page, pageSize]
  );

  const columns: DataTableColumnDef<InstallmentItem>[] = [
    {
      accessorKey: 'installment_no',
      header: '#',
      cell: ({ row }) => <span className="font-mono text-primary font-bold">{row.original.installment_no}</span>,
    },
    {
      accessorKey: 'due_date',
      header: 'Vence',
      cell: ({ row }) => <span className="text-xs">{formatDate(row.original.due_date)}</span>,
    },
    {
      accessorKey: 'amount_due',
      header: 'Monto',
      cell: ({ row }) => <span className="font-mono text-xs">{formatCurrency(row.original.amount_due)}</span>,
    },
    {
      accessorKey: 'amount_paid',
      header: 'Pagado',
      cell: ({ row }) => (
        <span className={`font-mono text-xs ${row.original.amount_paid > 0 ? 'text-emerald-600' : ''}`}>
          {formatCurrency(row.original.amount_paid)}
        </span>
      ),
    },
    {
      accessorKey: 'penalty_accrued',
      header: 'Mora',
      cell: ({ row }) => (
        <span className={`font-mono text-xs ${row.original.penalty_accrued > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
          {row.original.penalty_accrued > 0 ? formatCurrency(row.original.penalty_accrued) : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'outstanding',
      header: 'Pendiente',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs">
          {row.original.outstanding > 0 ? formatCurrency(row.original.outstanding) : <span className="text-emerald-600">✓</span>}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const sc = STATUS_CONFIG[row.original.status] ?? { label: row.original.status, variant: 'outline' as const };
        return <Badge variant={sc.variant} className="text-[10px]">{sc.label}</Badge>;
      },
    },
    {
      accessorKey: 'days_overdue',
      header: 'Atraso',
      cell: ({ row }) => (
        row.original.days_overdue > 0
          ? <span className="text-red-600 font-medium text-xs">{row.original.days_overdue}d</span>
          : <span className="text-xs text-muted-foreground">—</span>
      ),
    },
    {
      id: 'actions',
      header: 'Acción',
      cell: ({ row }) => {
        const i = row.original;
        const canNegotiate = i.status === 'OVERDUE' && i.days_overdue >= MIN_DAYS_OVERDUE_FOR_NEGOTIATION;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            {i.status === 'NEGOTIATED' && i.negotiation_credit_id ? (
              <Link
                href={`/admin/credits/${i.negotiation_credit_id}`}
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                Ver crédito <ExternalLink className="h-3 w-3" />
              </Link>
            ) : canNegotiate ? (
              <Link href={`/admin/credits/${data.credit_id}/installments/${i.installment_no}/negotiate`}>
                <Button size="sm" variant="outline" className="h-6 gap-1 text-[10px] px-2">
                  <Handshake className="h-3 w-3" />
                  Negociar
                </Button>
              </Link>
            ) : (
              <span className="text-[11px] text-muted-foreground">—</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="flex items-center gap-4 text-xs">
        <span className="text-muted-foreground">
          <span className="font-medium text-emerald-600">{paidCount}</span> pagada{paidCount !== 1 ? 's' : ''}
        </span>
        {overdueCount > 0 && (
          <span className="text-muted-foreground">
            <span className="font-medium text-red-600">{overdueCount}</span> vencida{overdueCount !== 1 ? 's' : ''}
          </span>
        )}
        <span className="text-muted-foreground ml-auto">
          Total pendiente: <span className="font-bold text-foreground">{formatCurrency(totalOutstanding)}</span>
        </span>
      </div>

      <DataTable
        columns={columns}
        data={pageData}
        pagination={{ page, pageSize, totalItems: data.installments.length, totalPages }}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        exportFileName={`cuotas-credito-${data.credit_id.slice(0, 8)}.xlsx`}
        getExportData={() => data.installments}
        enableExport
        onRowClick={(installment) => router.push(`/admin/credits/${data.credit_id}/installments/${installment.installment_no}`)}
      />
    </div>
  );
}
