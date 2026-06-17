'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { TrendingUp, Search } from 'lucide-react';
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
  const [allData, setAllData] = React.useState<PointsHistoryEntry[]>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await getPointsHistory();
      if (result.ok) {
        setAllData(result.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const table = useReactTable({
    data: allData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    initialState: { pagination: { pageSize: 10 } },
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const totalRows = table.getFilteredRowModel().rows.length;

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
          {totalRows} {totalRows === 1 ? 'movimiento' : 'movimientos'} registrados
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Buscador */}
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar movimiento..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
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
        {pageCount > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Página {pageIndex + 1} de {pageCount} · {totalRows} registro{totalRows !== 1 ? 's' : ''}
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
