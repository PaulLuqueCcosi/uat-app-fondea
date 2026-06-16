'use client';

import * as React from 'react';
import Link from 'next/link';
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
import { FileText, Search, ChevronRight, Plus, ArrowUpDown, RefreshCw } from 'lucide-react';
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
import { getApplicationsList } from '@/app/actions/applications-list.actions';
import {
  applicationStatusLabels,
  applicationStatusVariants,
  type ApplicationRecord,
  type ApplicationStatus,
} from '@/modules/applications';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ── Filtros de estado ─────────────────────────────────────────────────────────

type StatusFilter = 'ALL' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';

const STATUS_FILTER_MAP: Record<StatusFilter, ApplicationStatus[] | null> = {
  ALL: null,
  IN_PROGRESS: ['SUBMITTED', 'PROCESSING', 'PRE_APPROVED', 'PENDING_DOCUMENTS', 'PENDING_SIGNATURE'],
  APPROVED: ['APPROVED'],
  REJECTED: ['REJECTED', 'REJECTED_BY_USER', 'FAILED', 'BLOCKED', 'EXPIRED'],
};

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  ALL: 'Todas',
  IN_PROGRESS: 'En curso',
  APPROVED: 'Aprobadas',
  REJECTED: 'Rechazadas',
};

// ── Columnas ──────────────────────────────────────────────────────────────────

const columns: ColumnDef<ApplicationRecord>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <span className="text-sm font-mono text-muted-foreground">
        #{row.original.id.slice(0, 8)}
      </span>
    ),
  },
  {
    accessorKey: 'submittedAt',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Fecha
        <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-foreground">
        {formatDate(row.original.submittedAt)}
      </span>
    ),
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.submittedAt ? new Date(rowA.original.submittedAt).getTime() : 0;
      const b = rowB.original.submittedAt ? new Date(rowB.original.submittedAt).getTime() : 0;
      return a - b;
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={applicationStatusVariants[status]}>
          {applicationStatusLabels[status]}
        </Badge>
      );
    },
    filterFn: (row, _id, filterValue: ApplicationStatus[] | null) => {
      if (!filterValue) return true;
      return filterValue.includes(row.original.status);
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Link href={`/solicitudes/${row.original.id}`}>
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
          Ver
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </Link>
    ),
  },
];

// ── Componente ────────────────────────────────────────────────────────────────

export function ApplicationsTable() {
  const [data, setData] = React.useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('ALL');
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'submittedAt', desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  // Fetch una sola vez al montar
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getApplicationsList();
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

  // Aplicar filtro de estado como column filter
  const columnFilters = React.useMemo<ColumnFiltersState>(() => {
    const statuses = STATUS_FILTER_MAP[statusFilter];
    if (!statuses) return [];
    return [{ id: 'status', value: statuses }];
  }, [statusFilter]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = (filterValue as string).toLowerCase();
      return (
        row.original.id.toLowerCase().includes(q) ||
        row.original.status.toLowerCase().includes(q) ||
        (applicationStatusLabels[row.original.status] ?? '').toLowerCase().includes(q)
      );
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Mis Solicitudes
          </span>
        </CardTitle>
        <CardDescription>
          {data.length} {data.length === 1 ? 'solicitud' : 'solicitudes'} en total
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

        {/* Buscador + Recargar + CTA */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID o estado..."
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
          <Link href="/solicitar" className="ml-auto">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Nueva solicitud
            </Button>
          </Link>
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

        {/* Tabla */}
        <div className="overflow-hidden rounded-md border">
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
                  <TableRow key={row.id} className="hover:bg-muted/50">
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
                      <p className="text-sm text-muted-foreground">
                        {globalFilter || statusFilter !== 'ALL'
                          ? 'No se encontraron solicitudes con esos filtros'
                          : 'Aún no tienes solicitudes'}
                      </p>
                      {!globalFilter && statusFilter === 'ALL' && (
                        <Link href="/solicitar">
                          <Button size="sm" variant="outline" className="gap-1.5 mt-1">
                            <Plus className="w-3.5 h-3.5" />
                            Crear primera solicitud
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()} · {table.getFilteredRowModel().rows.length} resultado{table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
