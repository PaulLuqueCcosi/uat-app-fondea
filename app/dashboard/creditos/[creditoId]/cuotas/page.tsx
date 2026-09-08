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
  Hourglass,
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
import { getInstallmentViewStatus } from '@/modules/credits';
import { formatBackendDate, formatBackendDateShort } from '@/modules/shared/backend-date';
import { useBreadcrumbLabel } from '@/modules/shared/breadcrumb-labels';

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

// Las fechas del backend se formatean con los helpers de `modules/shared/backend-date`:
// `new Date('2026-07-21')` se parsea como medianoche UTC y en Perú muestra el 20.
const formatDate = formatBackendDate;
const formatDateShort = formatBackendDateShort;

// ── Status config ─────────────────────────────────────────────────────────────
//
// Se indexa por el estado VISIBLE (getInstallmentViewStatus), no por el contable: una
// cuota OVERDUE con comprobante en revisión se muestra como UNDER_REVIEW.

type ViewStatus = ReturnType<typeof getInstallmentViewStatus>['status'];

const statusIconBg: Record<ViewStatus, string> = {
  PAID: 'bg-accent-500',
  UNDER_REVIEW: 'bg-primary-400',
  CURRENT: 'bg-warning-400',
  PARTIALLY_PAID: 'bg-warning-400',
  PENDING: 'bg-neutral-200',
  OVERDUE: 'bg-error-500',
  NEGOTIATED: 'bg-primary-500',
};

function StatusIcon({ status }: { status: ViewStatus }) {
  switch (status) {
    case 'PAID':
      return <CheckCircle className="w-3.5 h-3.5 text-white" />;
    case 'UNDER_REVIEW':
      return <Hourglass className="w-3.5 h-3.5 text-white" />;
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

// Se filtra por el estado CONTABLE (el que trae el backend) — "en revisión" no es un
// estado del backend sino una lectura de `hasPendingDeclaration`, así que una cuota con
// comprobante pendiente sigue apareciendo bajo el filtro que le corresponde por status.
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
    cell: ({ row }) => {
      const { penaltyAccrued, hasPendingDeclaration } = row.original;
      if (penaltyAccrued <= 0) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }
      // Con comprobante en revisión la mora está congelada en el backend: no sigue
      // creciendo. Se muestra el monto pero sin el rojo de urgencia, porque el cliente
      // ya pagó y lo más probable es que esa mora desaparezca al aprobarse.
      return (
        <span className={`text-sm ${hasPendingDeclaration ? 'text-muted-foreground' : 'text-error-600 font-medium'}`}>
          {formatCurrency(penaltyAccrued)}
          {hasPendingDeclaration && <span className="ml-1 text-[10px]">(detenida)</span>}
        </span>
      );
    },
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
    cell: ({ row }) => {
      const view = getInstallmentViewStatus(row.original);
      return (
        <div className="flex items-center gap-1.5">
          <Badge variant={view.variant}>{view.label}</Badge>
          {view.status === 'OVERDUE' && row.original.daysOverdue > 0 && (
            <span className="text-[10px] text-error-600 font-medium">
              +{row.original.daysOverdue}d
            </span>
          )}
        </div>
      );
    },
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
      const view = getInstallmentViewStatus(inst);
      return (
        <div className="flex items-center gap-1.5 justify-end">
          {/* La fila entera navega al detalle de la cuota, que es donde está el
              formulario para subir el comprobante. Antes había acá un botón "Pagar" con
              onClick={e => e.stopPropagation()}: no navegaba ni abría nada, el usuario
              hacía clic y no pasaba absolutamente nada. */}
          {view.canDeclarePayment && (
            <span className={`text-[11px] font-medium ${
              view.status === 'OVERDUE' ? 'text-error-600' : 'text-accent-800'
            }`}>
              Declarar pago
            </span>
          )}
          {view.status === 'UNDER_REVIEW' && (
            <span className="text-[11px] text-primary-700 font-medium">Ver comprobante</span>
          )}
          {view.status === 'NEGOTIATED' && inst.negotiationCreditId && (
            <span className="text-[11px] text-primary-700 font-medium">
              Ver refinanciamiento
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
  const view = getInstallmentViewStatus(inst);

  return (
    <Link href={`/dashboard/creditos/${creditoId}/cuotas/${inst.installmentNo}`} className="block group">
      <div className="rounded-lg border border-border bg-card p-4 transition-all group-hover:border-primary/40 group-hover:shadow-sm group-active:scale-[0.98]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${statusIconBg[view.status]}`}>
              <StatusIcon status={view.status} />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Cuota {inst.installmentNo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={view.variant}>{view.label}</Badge>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>

        <div className="flex items-baseline justify-between mb-2">
          <p className="text-lg font-bold text-foreground">{formatCurrency(inst.outstanding > 0 ? inst.outstanding : inst.amountDue)}</p>
          {inst.penaltyAccrued > 0 && (
            <span className={`text-xs font-medium ${
              inst.hasPendingDeclaration ? 'text-muted-foreground' : 'text-error-600'
            }`}>
              +{formatCurrencyShort(inst.penaltyAccrued)} mora
              {inst.hasPendingDeclaration && ' (detenida)'}
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
          {view.status === 'OVERDUE' && inst.daysOverdue > 0 && (
            <span className="text-error-600 font-medium">
              {inst.daysOverdue} días de atraso
            </span>
          )}
        </div>

        {/* El Link padre ya lleva al detalle, donde está el formulario de comprobante.
            Antes había acá un <Button onClick={e => e.preventDefault()}> que BLOQUEABA
            la navegación del Link: tocarlo no hacía nada. */}
        {(view.canDeclarePayment || view.status === 'UNDER_REVIEW') && (
          <div className="mt-3 pt-2 border-t border-border/50">
            <p className={`text-xs font-medium flex items-center gap-1.5 ${
              view.status === 'OVERDUE' ? 'text-error-700'
              : view.status === 'UNDER_REVIEW' ? 'text-primary-700'
              : 'text-accent-800'
            }`}>
              {view.status === 'UNDER_REVIEW'
                ? <><Hourglass className="w-3.5 h-3.5" />Comprobante en revisión</>
                : <><DollarSign className="w-3.5 h-3.5" />Toca para declarar tu pago</>}
            </p>
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
  useBreadcrumbLabel(creditoId, credit?.creditCode);
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
  const underReviewCount = data.filter(
    (i) => getInstallmentViewStatus(i).status === 'UNDER_REVIEW',
  ).length;
  // Vencidas SIN comprobante en revisión — son las que el cliente todavía tiene que
  // resolver. Contar las que ya tienen comprobante subido como "vencidas" le diría que
  // debe actuar cuando ya actuó.
  const overdueCount = data.filter(
    (i) => getInstallmentViewStatus(i).status === 'OVERDUE',
  ).length;

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
          {underReviewCount > 0 && (
            <span className="text-primary-700 font-medium">
              {' '}· {underReviewCount} en revisión
            </span>
          )}
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
