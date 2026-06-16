'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { ArrowUpDown, TrendingUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { getPointsHistory } from '@/app/actions/passport.actions';
import type { PointsHistoryEntry } from '@/modules/passport';
import type { PaginatedResponse } from '@/modules/shared/pagination';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ── Columnas ──────────────────────────────────────────────────────────────────

const columns: ColumnDef<PointsHistoryEntry>[] = [
  {
    accessorKey: 'date',
    header: 'Fecha',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.getValue('date'))}
      </span>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ row }) => (
      <span className="text-sm font-medium text-foreground">
        {row.getValue('description')}
      </span>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      return (
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            type === 'EARNED'
              ? 'bg-accent-50 text-accent-700'
              : 'bg-error-50 text-error-700'
          }`}
        >
          {type === 'EARNED' ? 'Ganado' : 'Canjeado'}
        </span>
      );
    },
  },
  {
    accessorKey: 'points',
    header: () => <div className="text-right">Puntos</div>,
    cell: ({ row }) => {
      const points = row.getValue('points') as number;
      const type = row.original.type;
      return (
        <div className={`text-right text-sm font-bold ${
          type === 'EARNED' ? 'text-accent-600' : 'text-error-600'
        }`}>
          {type === 'EARNED' ? '+' : '-'}{points} pts
        </div>
      );
    },
  },
];

// ── Componente ────────────────────────────────────────────────────────────────

export function PassportHistoryTable() {
  const [data, setData] = React.useState<PointsHistoryEntry[]>([]);
  const [page, setPage] = React.useState(0);
  const [pageSize] = React.useState(10);
  const [search, setSearch] = React.useState('');
  const [pagination, setPagination] = React.useState<Omit<PaginatedResponse<unknown>, 'items'>>({
    totalElements: 0,
    totalPages: 0,
    page: 0,
    size: 10,
    first: true,
    last: true,
  });
  const [loading, setLoading] = React.useState(true);

  // Debounce de búsqueda
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const fetchData = React.useCallback(async (p: number, q: string) => {
    setLoading(true);
    const result = await getPointsHistory({
      page: p,
      size: pageSize,
      sortBy: 'date',
      sortDir: 'desc',
      search: q || undefined,
    });

    if (result.ok) {
      setData(result.data.items);
      setPagination({
        totalElements: result.data.totalElements,
        totalPages: result.data.totalPages,
        page: result.data.page,
        size: result.data.size,
        first: result.data.first,
        last: result.data.last,
      });
    }
    setLoading(false);
  }, [pageSize]);

  // Fetch inicial y cuando cambia página
  React.useEffect(() => {
    fetchData(page, search);
  }, [page, fetchData]);

  // Búsqueda con debounce
  function handleSearch(value: string) {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(0); // Reset a primera página
      fetchData(0, value);
    }, 300);
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Historial de puntos
          </span>
        </CardTitle>
        <CardDescription>
          {pagination.totalElements} {pagination.totalElements === 1 ? 'movimiento' : 'movimientos'} registrados
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Buscador */}
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar movimiento..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>

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
                // Skeleton rows
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
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    No se encontraron movimientos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Página {pagination.page + 1} de {pagination.totalPages || 1} · {pagination.totalElements} registro{pagination.totalElements !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={pagination.first}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={pagination.last}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
