'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import {
  CreditCard,
  Search,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  Calendar,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { getCreditsAction } from '@/app/actions/credit.actions';
import {
  creditStatusLabels,
  type Credit,
  type CreditStatus,
} from '@/modules/credits';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ── Config de status ──────────────────────────────────────────────────────────

const statusVariants: Record<CreditStatus, 'success' | 'completed' | 'error' | 'default'> = {
  ACTIVE: 'success',
  PAID_OFF: 'completed',
  OVERDUE: 'error',
  DEFAULTED: 'error',
};

// ── Filtros de estado ─────────────────────────────────────────────────────────

type StatusFilter = 'ALL' | 'ACTIVE' | 'PAID_OFF' | 'OVERDUE';

const STATUS_FILTER_MAP: Record<StatusFilter, CreditStatus[] | null> = {
  ALL: null,
  ACTIVE: ['ACTIVE'],
  PAID_OFF: ['PAID_OFF'],
  OVERDUE: ['OVERDUE', 'DEFAULTED'],
};

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  ALL: 'Todos',
  ACTIVE: 'Activos',
  PAID_OFF: 'Liquidados',
  OVERDUE: 'Vencidos',
};

// ── Columnas ──────────────────────────────────────────────────────────────────

const columns: ColumnDef<Credit>[] = [
  {
    accessorKey: 'principal',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Monto
        <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm font-semibold text-foreground">
        {formatCurrency(row.original.principal)}
      </span>
    ),
  },
  {
    accessorKey: 'disbursedAt',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Desembolso
        <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-foreground">
        {formatDate(row.original.disbursedAt)}
      </span>
    ),
    sortingFn: (rowA, rowB) => {
      const a = new Date(rowA.original.disbursedAt).getTime();
      const b = new Date(rowB.original.disbursedAt).getTime();
      return a - b;
    },
  },
  {
    accessorKey: 'installments',
    header: 'Cuotas',
    cell: ({ row }) => (
      <span className="text-sm text-foreground">
        {row.original.installmentsCompleted}/{row.original.installmentCount}
      </span>
    ),
  },
  {
    accessorKey: 'totalOutstanding',
    header: 'Saldo',
    cell: ({ row }) => (
      <span className="text-sm text-foreground">
        {formatCurrency(row.original.totalOutstanding)}
      </span>
    ),
  },
  {
    accessorKey: 'maturityDate',
    header: 'Vencimiento',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.maturityDate)}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={statusVariants[status]}>
          {creditStatusLabels[status]}
        </Badge>
      );
    },
    filterFn: (row, _id, filterValue: CreditStatus[] | null) => {
      if (!filterValue) return true;
      return filterValue.includes(row.original.status);
    },
  },
  {
    id: 'chevron',
    header: '',
    cell: () => (
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    ),
  },
];

// ── Card móvil ────────────────────────────────────────────────────────────────

function CreditMobileCard({ credit }: { credit: Credit }) {
  const progress = credit.installmentCount > 0
    ? Math.round((credit.installmentsCompleted / credit.installmentCount) * 100)
    : 0;

  return (
    <Link href={`/dashboard/creditos/${credit.id}`} className="block group">
      <div className="rounded-lg border border-border bg-card p-4 transition-all group-hover:border-primary/40 group-hover:shadow-sm group-active:scale-[0.98]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-bold text-foreground">
            {formatCurrency(credit.principal)}
          </span>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariants[credit.status]}>
              {creditStatusLabels[credit.status]}
            </Badge>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>

        <div className="mb-3">
          <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {credit.installmentsCompleted} de {credit.installmentCount} cuotas pagadas
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(credit.disbursedAt)}
          </span>
          {credit.status !== 'PAID_OFF' && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Vence {formatDate(credit.maturityDate)}
            </span>
          )}
        </div>

        {credit.totalOutstanding > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <span className="text-xs text-muted-foreground">Saldo pendiente: </span>
            <span className="text-xs font-semibold text-foreground">
              {formatCurrency(credit.totalOutstanding)}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Skeleton móvil ────────────────────────────────────────────────────────────

function CreditMobileCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-6 w-24 rounded bg-muted" />
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <div className="h-2 rounded-full bg-muted mb-3" />
      <div className="flex gap-4">
        <div className="h-4 w-20 rounded bg-muted" />
        <div className="h-4 w-24 rounded bg-muted" />
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function CreditsTable() {
  const router = useRouter();
  const [data, setData] = React.useState<Credit[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('ALL');
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'disbursedAt', desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getCreditsAction();
    if (result.ok) {
      setData(result.data);
    } else {
      setError(result.error.message);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columnFilters = React.useMemo<ColumnFiltersState>(() => {
    const statuses = STATUS_FILTER_MAP[statusFilter];
    if (!statuses) return [];
    return [{ id: 'status', value: statuses }];
  }, [statusFilter]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, columnFilters },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = (filterValue as string).toLowerCase();
      return (
        row.original.id.toLowerCase().includes(q) ||
        formatCurrency(row.original.principal).toLowerCase().includes(q) ||
        (creditStatusLabels[row.original.status] ?? '').toLowerCase().includes(q)
      );
    },
  });

  const filteredData = React.useMemo(() => {
    return table.getFilteredRowModel().rows.map((row) => row.original);
  }, [table.getFilteredRowModel().rows]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Mis Créditos
          </span>
        </CardTitle>
        <CardDescription>
          {data.length} {data.length === 1 ? 'crédito' : 'créditos'} en total
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filtros de estado */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STATUS_FILTER_LABELS) as StatusFilter[]).map((key) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === key
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              }`}
            >
              {STATUS_FILTER_LABELS[key]}
            </button>
          ))}
        </div>

        {/* Buscador + Recargar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por monto o estado..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700">
            {error}
            <Button variant="ghost" size="sm" className="ml-2" onClick={fetchData}>
              Reintentar
            </Button>
          </div>
        )}

        {/* Vista MÓVIL */}
        <div className="md:hidden space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <CreditMobileCardSkeleton key={i} />)
          ) : filteredData.length > 0 ? (
            filteredData.map((credit) => <CreditMobileCard key={credit.id} credit={credit} />)
          ) : (
            <div className="flex flex-col items-center gap-2 py-8">
              <CreditCard className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {globalFilter || statusFilter !== 'ALL'
                  ? 'No se encontraron créditos con esos filtros'
                  : 'Aún no tienes créditos desembolsados'}
              </p>
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
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-primary/5 transition-colors group"
                    onClick={() => router.push(`/dashboard/creditos/${row.original.id}`)}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/dashboard/creditos/${row.original.id}`);
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
                      <CreditCard className="w-10 h-10 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        {globalFilter || statusFilter !== 'ALL'
                          ? 'No se encontraron créditos con esos filtros'
                          : 'Aún no tienes créditos desembolsados'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {table.getPageCount() > 1 && (
          <div className="hidden md:flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
