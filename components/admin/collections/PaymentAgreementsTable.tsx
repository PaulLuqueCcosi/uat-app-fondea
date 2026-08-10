'use client';

import { useCallback, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/admin/DataTable';
import type { PaymentAgreement } from '@/modules/admin/admin-collections.types';
import type { Pagination } from '@/modules/admin/admin-users.types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  const date = new Date(iso + 'T00:00:00');
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

function getDaysLabel(days: number | null, paid: boolean): { text: string; className: string } {
  if (paid) return { text: 'Pagada', className: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (days === null) return { text: '—', className: 'text-muted-foreground bg-muted border-transparent' };
  if (days < 0) return { text: `${Math.abs(days)}d vencida`, className: 'text-red-700 bg-red-50 border-red-200' };
  if (days === 0) return { text: 'Vence hoy', className: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (days <= 3) return { text: `Vence en ${days}d`, className: 'text-amber-700 bg-amber-50 border-amber-200' };
  return { text: `Vence en ${days}d`, className: 'text-muted-foreground bg-muted border-transparent' };
}

// ── Columnas ─────────────────────────────────────────────────────────────────

const columns = [
  {
    accessorKey: 'clientName',
    header: 'Cliente',
    cell: ({ row }: { row: { original: PaymentAgreement } }) => {
      const { clientName, clientDocument, creditId } = row.original;
      return (
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-medium text-sm truncate max-w-[160px]">{clientName}</span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {clientDocument} · #{creditId.slice(0, 6)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total acordado',
    cell: ({ row }: { row: { original: PaymentAgreement } }) => (
      <span className="text-xs font-semibold">S/ {row.original.totalAmount.toLocaleString()}</span>
    ),
  },
  {
    id: 'progress',
    header: 'Progreso',
    cell: ({ row }: { row: { original: PaymentAgreement } }) => {
      const { installments } = row.original;
      const paidCount = installments.filter((i) => i.paid).length;
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border bg-muted/50 border-muted-foreground/20">
          {paidCount}/{installments.length} cuotas
        </span>
      );
    },
  },
  {
    id: 'cuotasDetail',
    header: 'Cuotas',
    cell: ({ row }: { row: { original: PaymentAgreement } }) => (
      <div className="flex flex-wrap gap-1.5 max-w-md">
        {row.original.installments.map((inst) => {
          const daysInfo = getDaysLabel(inst.daysUntilDue, inst.paid);
          return (
            <span
              key={inst.installmentNo}
              className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] ${daysInfo.className}`}
              title={`Cuota ${inst.installmentNo}: S/ ${inst.amount.toLocaleString()} — ${fmtDate(inst.dueDate)}`}
            >
              <span className="font-medium">
                #{inst.installmentNo} S/{inst.amount.toLocaleString()} ({fmtDate(inst.dueDate)})
              </span>
              <span>· {daysInfo.text}</span>
            </span>
          );
        })}
      </div>
    ),
  },
];

// ── Componente ───────────────────────────────────────────────────────────────

interface PaymentAgreementsTableProps {
  data: PaymentAgreement[];
  pagination: Pagination;
}

export function PaymentAgreementsTable({ data, pagination }: PaymentAgreementsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateUrl = useCallback(
    (params: URLSearchParams) => {
      startTransition(() => { router.push(`/admin/collections?${params.toString()}`); });
    },
    [router]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', 'agreements');
      params.set('apage', String(newPage));
      updateUrl(params);
    },
    [searchParams, updateUrl]
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', 'agreements');
      params.set('asize', String(newSize));
      params.set('apage', '1');
      updateUrl(params);
    },
    [searchParams, updateUrl]
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      pagination={pagination}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      exportFileName="cobranza-acuerdos.xlsx"
      getExportData={() => data}
      enableExport={true}
      isLoading={isPending}
      onRowClick={(row) => router.push(`/admin/credits/${row.creditId}`)}
    />
  );
}
