'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import {
  ArrowLeft,
  ArrowUpDown,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  FileText,
  ChevronRight,
  TrendingUp,
  RefreshCw as RefreshCwIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  getInstallmentsAction,
  getCreditByIdAction,
} from '@/app/actions/credit.actions';
import type { Installment, InstallmentStatus, Credit } from '@/modules/credits';
import { installmentStatusLabels } from '@/modules/credits';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatCurrencyShort(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
  });
}

// ── Status config ─────────────────────────────────────────────────────────────

const statusBadgeVariant: Record<InstallmentStatus, 'success' | 'warning' | 'error' | 'pending'> = {
  PAID: 'success',
  CURRENT: 'warning',
  PARTIALLY_PAID: 'warning',
  PENDING: 'pending',
  OVERDUE: 'error',
  NEGOTIATED: 'warning',
};

const statusIconBg: Record<InstallmentStatus, string> = {
  PAID: 'bg-accent-500',
  CURRENT: 'bg-warning-400',
  PARTIALLY_PAID: 'bg-warning-400',
  PENDING: 'bg-neutral-200',
  OVERDUE: 'bg-error-500',
  NEGOTIATED: 'bg-primary-500',
};

function StatusIcon({ status }: { status: InstallmentStatus }) {
  switch (status) {
    case 'PAID':
      return <CheckCircle className="w-3.5 h-3.5 text-white" />;
    case 'CURRENT':
    case 'PARTIALLY_PAID':
      return <Clock className="w-3.5 h-3.5 text-warning-900" />;
    case 'OVERDUE':
      return <AlertCircle className="w-3.5 h-3.5 text-white" />;
    case 'NEGOTIATED':
      return <RefreshCwIcon className="w-3.5 h-3.5 text-white" />;
    default:
      return <Clock className="w-3.5 h-3.5 text-neutral-500" />;
  }
}

// ── Filtros ───────────────────────────────────────────────────────────────────

type CuotaFilter = 'ALL' | 'PAID' | 'PENDING' | 'OVERDUE';

const FILTER_LABELS: Record<CuotaFilter, string> = {
  ALL: 'Todas',
  PAID: 'Pagadas',
  PENDING: 'Pendientes',
  OVERDUE: 'Vencidas',
};

const FILTER_MAP: Record<CuotaFilter, InstallmentStatus[] | null> = {
  ALL: null,
  PAID: ['PAID'],
  PENDING: ['PENDING', 'CURRENT', 'PARTIALLY_PAID'],
  OVERDUE: ['OVERDUE'],
};

// ── Columnas ──────────────────────────────────────────────────────────────────

const columns: ColumnDef<Installment>[] = [
  {
    accessorKey: 'installmentNo',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Cuota
        <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium text-foreground">
        {row.original.installmentNo}
      </span>
    ),
  },
  {
    accessorKey: 'dueDate',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Vencimiento
        <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-foreground">
        {formatDate(row.original.dueDate)}
      </span>
    ),
    sortingFn: (rowA, rowB) => {
      return new Date(rowA.original.dueDate).getTime() - new Date(rowB.original.dueDate).getTime();
    },
  },
  {
    accessorKey: 'amountDue',
    header: 'Monto',
    cell: ({ row }) => (
      <span className="text-sm font-semibold text-foreground">
        {formatCurrency(row.original.amountDue)}
      </span>
    ),
  },
  {
    accessorKey: 'penaltyAccrued',
    header: 'Mora',
    cell: ({ row }) => (
      <span className={`text-sm ${row.original.penaltyAccrued > 0 ? 'text-error-600 font-medium' : 'text-muted-foreground'}`}>
        {row.original.penaltyAccrued > 0 ? formatCurrency(row.original.penaltyAccrued) : '—'}
      </span>
    ),
  },
  {
    accessorKey: 'outstanding',
    header: 'Pendiente',
    cell: ({ row }) => (
      <span className="text-sm text-foreground">
        {row.original.outstanding > 0 ? formatCurrency(row.original.outstanding) : '—'}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <Badge variant={statusBadgeVariant[row.original.status]}>
          {installmentStatusLabels[row.original.status]}
        </Badge>
        {row.original.status === 'OVERDUE' && row.original.daysOverdue > 0 && (
          <span className="text-[10px] text-error-600 font-medium">
            +{row.original.daysOverdue}d
          </span>
        )}
      </div>
    ),
    filterFn: (row, _id, filterValue: InstallmentStatus[] | null) => {
      if (!filterValue) return true;
      return filterValue.includes(row.original.status);
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const inst = row.original;
      return (
        <div className="flex items-center gap-1.5 justify-end">
          {(inst.status === 'CURRENT' || inst.status === 'OVERDUE' || inst.status === 'PARTIALLY_PAID') && (
            <Button
              size="sm"
              className={`gap-1 text-xs ${
                inst.status === 'OVERDUE'
                  ? 'bg-error-600 text-white hover:bg-error-700'
                  : 'bg-accent-500 text-accent-900 hover:bg-accent-400'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <DollarSign className="w-3 h-3" />
              Pagar
            </Button>
          )}
          {inst.status === 'NEGOTIATED' && (
            <span className="text-[11px] text-primary-700 font-medium">
              Ver crédito de refinanciamiento
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      );
    },
  },
];

// ── Card móvil ────────────────────────────────────────────────────────────────

function InstallmentMobileCard({
  inst,
  creditoId,
}: {
  inst: Installment;
  creditoId: string;
}) {
  return (
    <Link href={`/dashboard/creditos/${creditoId}/cuotas/${inst.installmentNo}`} className="block group">
      <div className="rounded-lg border border-border bg-card p-4 transition-all group-hover:border-primary/40 group-hover:shadow-sm group-active:scale-[0.98]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${statusIconBg[inst.status]}`}>
              <StatusIcon status={inst.status} />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Cuota {inst.installmentNo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusBadgeVariant[inst.status]}>
              {installmentStatusLabels[inst.status]}
            </Badge>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>

        <div className="flex items-baseline justify-between mb-2">
          <p className="text-lg font-bold text-foreground">{formatCurrency(inst.outstanding > 0 ? inst.outstanding : inst.amountDue)}</p>
          {inst.penaltyAccrued > 0 && (
            <span className="text-xs text-error-600 font-medium">
              +{formatCurrencyShort(inst.penaltyAccrued)} mora
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Vence: {formatDateShort(inst.dueDate)}
          </span>
          {inst.paidAt && (
            <span className="flex items-center gap-1 text-accent-700">
              <CheckCircle className="w-3 h-3" />
              Pagada: {formatDateShort(inst.paidAt)}
            </span>
          )}
          {inst.status === 'OVERDUE' && inst.daysOverdue > 0 && (
            <span className="text-error-600 font-medium">
              {inst.daysOverdue} días de atraso
            </span>
          )}
        </div>

        {(inst.status === 'CURRENT' || inst.status === 'OVERDUE' || inst.status === 'PARTIALLY_PAID') && (
          <div className="mt-3 pt-2 border-t border-border/50">
            <Button
              size="sm"
              className={`w-full gap-1.5 ${
                inst.status === 'OVERDUE'
                  ? 'bg-error-600 text-white hover:bg-error-700'
                  : 'bg-accent-500 text-accent-900 hover:bg-accent-400'
              }`}
              onClick={(e) => e.preventDefault()}
            >
              <DollarSign className="w-3.5 h-3.5" />
              {inst.status === 'OVERDUE' ? 'Pagar ahora' : 'Pagar cuota'}
            </Button>
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Skeleton móvil ────────────────────────────────────────────────────────────

function InstallmentMobileCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-muted" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
        <div className="h-5 w-16 bg-muted rounded-full" />
      </div>
      <div className="h-6 w-24 bg-muted rounded mb-2" />
      <div className="h-3 w-40 bg-muted rounded" />
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CuotasPage() {
  const params = useParams();
  const router = useRouter();
  const creditoId = params.creditoId as string;

  const [data, setData] = React.useState<Installment[]>([]);
  const [credit, setCredit] = React.useState<Credit | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<CuotaFilter>('ALL');
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'installmentNo', desc: false },
  ]);

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [installmentsRes, creditRes] = await Promise.all([
        getInstallmentsAction(creditoId),
        getCreditByIdAction(creditoId),
      ]);
      if (installmentsRes.ok) {
        setData(installmentsRes.data);
      } else {
        setError(installmentsRes.error.message);
      }
      if (creditRes.ok) {
        setCredit(creditRes.data);
      }
      setLoading(false);
    }
    fetchData();
  }, [creditoId]);

  const columnFilters = React.useMemo<ColumnFiltersState>(() => {
    const statuses = FILTER_MAP[statusFilter];
    if (!statuses) return [];
    return [{ id: 'status', value: statuses }];
  }, [statusFilter]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const paidCount = data.filter((i) => i.status === 'PAID').length;
  const overdueCount = data.filter((i) => i.status === 'OVERDUE').length;

  const filteredData = React.useMemo(() => {
    return table.getFilteredRowModel().rows.map((row) => row.original);
  }, [table.getFilteredRowModel().rows]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 animate-pulse">
        <div className="h-4 w-28 bg-neutral-200 rounded" />
        <div className="h-7 w-56 bg-neutral-200 rounded" />
        <div className="hidden md:block h-64 bg-neutral-50 rounded-xl border" />
        <div className="md:hidden space-y-3">
          {[1, 2, 3].map((i) => <InstallmentMobileCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <CreditCard className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Link href={`/dashboard/creditos/${creditoId}`}>
          <Button variant="outline" size="sm">Volver al crédito</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* ─── Navegación ─── */}
      <Link
        href={`/dashboard/creditos/${creditoId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Detalle del crédito
      </Link>

      {/* ─── Header ─── */}
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Cronograma de Cuotas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {credit && <span>{formatCurrencyShort(credit.principal)} · </span>}
          {paidCount} de {data.length} cuotas pagadas
          {overdueCount > 0 && (
            <span className="text-error-600 font-medium"> · {overdueCount} vencida{overdueCount > 1 ? 's' : ''}</span>
          )}
        </p>
      </div>

      {/* ─── Tabla / Cards ─── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Detalle por cuota
            </span>
          </CardTitle>
          <CardDescription>
            Toca una fila para ver el desglose completo
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FILTER_LABELS) as CuotaFilter[]).map((key) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  statusFilter === key
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-card text-foreground hover:bg-muted'
                }`}
              >
                {FILTER_LABELS[key]}
                {key === 'OVERDUE' && overdueCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[9px] font-bold">
                    {overdueCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Vista MÓVIL */}
          <div className="md:hidden space-y-3">
            {filteredData.length > 0 ? (
              filteredData.map((inst) => (
                <InstallmentMobileCard key={inst.id} inst={inst} creditoId={creditoId} />
              ))
            ) : (
              <div className="flex flex-col items-center gap-2 py-8">
                <FileText className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No hay cuotas con ese filtro</p>
              </div>
            )}
          </div>

          {/* Vista DESKTOP */}
          <div className="hidden md:block overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer hover:bg-primary/5 transition-colors"
                      onClick={() =>
                        router.push(`/dashboard/creditos/${creditoId}/cuotas/${row.original.installmentNo}`)
                      }
                      role="link"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/dashboard/creditos/${creditoId}/cuotas/${row.original.installmentNo}`);
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-10 h-10 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No hay cuotas con ese filtro</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
