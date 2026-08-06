'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumnDef, type DataTablePagination } from '@/components/admin/DataTable';
import { AlertTriangle, CheckCircle2, Clock, FileText } from 'lucide-react';
import type { MyComplaint, Pagination } from '@/modules/complaints';
import { ComplaintDetailDialog } from './ComplaintDetailDialog';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: string): { label: string; variant: 'success' | 'warning' | 'secondary'; icon: React.ReactNode } {
  switch (status) {
    case 'RESPONDIDO':
      return { label: 'Respondido', variant: 'success', icon: <CheckCircle2 className="h-3 w-3" /> };
    case 'EN_REVISION':
      return { label: 'En revisión', variant: 'warning', icon: <Clock className="h-3 w-3" /> };
    default:
      return { label: 'Registrado', variant: 'secondary', icon: <FileText className="h-3 w-3" /> };
  }
}

/** Solo se resalta con color cuando es urgente/vencido — el resto queda neutro. */
function getCountdownDisplay(remaining: number, isOverdue: boolean): { text: string; variant?: 'warning' | 'error' } {
  if (isOverdue || remaining < 0) {
    return { text: `Vencido (${Math.abs(remaining)}d háb.)`, variant: 'error' };
  }
  if (remaining <= 5) {
    return { text: `${remaining} días háb. restantes`, variant: 'warning' };
  }
  return { text: `${remaining} días háb. restantes` };
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

const columns: DataTableColumnDef<MyComplaint>[] = [
  {
    accessorKey: 'correlativeNumber',
    header: '#',
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold">#{String(row.original.correlativeNumber).padStart(2, '0')}</span>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }) => (
      <Badge variant="outline" className="text-[10px]">{row.original.type === 'RECLAMO' ? 'Reclamo' : 'Queja'}</Badge>
    ),
  },
  {
    accessorKey: 'productServiceDetail',
    header: 'Producto / servicio',
    cell: ({ row }) => <span className="text-sm truncate max-w-[220px] block">{row.original.productServiceDetail}</span>,
  },
  {
    accessorKey: 'submittedDate',
    header: 'Ingresado',
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.submittedDate)}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const cfg = getStatusBadge(row.original.status);
      return <Badge variant={cfg.variant} className="text-[10px] gap-1">{cfg.icon}{cfg.label}</Badge>;
    },
  },
  {
    id: 'countdown',
    header: 'Plazo',
    cell: ({ row }) => {
      const c = row.original;
      if (c.status === 'RESPONDIDO') return <span className="text-xs text-muted-foreground">—</span>;
      const countdown = getCountdownDisplay(c.businessDaysRemaining, c.isOverdue);
      return countdown.variant ? (
        <Badge variant={countdown.variant} className="text-[10px] gap-1">
          {c.isOverdue && <AlertTriangle className="h-2.5 w-2.5" />}
          {countdown.text}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">{countdown.text}</span>
      );
    },
  },
];

// ── Componente ───────────────────────────────────────────────────────────────

interface ComplaintsListProps {
  complaints: MyComplaint[];
  pagination: Pagination;
}

export function ComplaintsList({ complaints, pagination }: ComplaintsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<MyComplaint | null>(null);

  const updateUrl = useCallback(
    (params: URLSearchParams) => {
      router.push(`/dashboard/reclamos?${params.toString()}`);
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

  const dataTablePagination: DataTablePagination = pagination;

  if (pagination.totalItems === 0) {
    return (
      <div className="py-12 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No tienes reclamos registrados</p>
        <p className="text-xs text-muted-foreground mt-1">
          Si tienes alguna disconformidad con el servicio, puedes registrar un reclamo usando el botón de arriba.
        </p>
      </div>
    );
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={complaints}
        pagination={dataTablePagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        enableExport={false}
        onRowClick={(row) => setSelected(row)}
      />

      <ComplaintDetailDialog complaint={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  );
}
