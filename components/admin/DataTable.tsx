'use client';

import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  FileText,
  X,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import * as XLSX from 'xlsx';

/** ─── Tipos ──────────────────────────────────────────────────────────────── */

export interface DataTableColumnMeta {
  enableColumnFilter?: boolean;
  filterPlaceholder?: string;
}

export type DataTableColumnDef<TData, TValue = unknown> = ColumnDef<TData, TValue> & {
  meta?: DataTableColumnMeta;
};

export interface DataTablePagination {
  page: number;          // 1-based
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface DataTableProps<TData> {
  columns: DataTableColumnDef<TData>[];
  data: TData[];
  pagination: DataTablePagination;

  // ── Eventos server-side ─────────────────────────────────────────────────
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;

  // ── Filtros por columna (server-side) ───────────────────────────────────
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  enableColumnFilters?: boolean;

  // ── Sorting (server-side) ───────────────────────────────────────────────
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  enableSorting?: boolean;

  // ── Exportación ─────────────────────────────────────────────────────────
  exportFileName?: string;
  getExportData?: () => TData[];
  enableExport?: boolean;
  exportFilterLabel?: string;

  // ── Loading / Empty ─────────────────────────────────────────────────────
  isLoading?: boolean;
  pageSizeOptions?: number[];
}

/** ─── Componente ─────────────────────────────────────────────────────────── */

export function DataTable<TData>({
  columns,
  data,
  pagination,
  onPageChange,
  onPageSizeChange,
  columnFilters,
  onColumnFiltersChange,
  enableColumnFilters = false,
  sorting = [],
  onSortingChange,
  enableSorting = false,
  exportFileName = 'export.xlsx',
  getExportData,
  enableExport = true,
  exportFilterLabel,
  isLoading,
  pageSizeOptions = [10, 20, 50, 100],
}: DataTableProps<TData>) {
  // TanStack Table internamente trabaja con pageIndex 0-based
  const pageIndex = Math.max(0, pagination.page - 1);

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination: {
        pageIndex,
        pageSize: pagination.pageSize,
      },
      columnFilters,
      sorting,
    },
    // Headless: todo server-side
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    rowCount: pagination.totalItems,
    // Modelos
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // Eventos
    onColumnFiltersChange: (updater) => {
      if (!onColumnFiltersChange) return;
      const current = columnFilters ?? [];
      const next = typeof updater === 'function' ? updater(current) : updater;
      onColumnFiltersChange(next);
    },
    onSortingChange: (updater) => {
      if (!onSortingChange) return;
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      onSortingChange(next);
    },
  });

  // ── Estado local para debounce de filtros ───────────────────────────────
  const [localFilterInputs, setLocalFilterInputs] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    (columnFilters ?? []).forEach((f) => {
      initial[f.id] = String(f.value ?? '');
    });
    return initial;
  });

  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleFilterInputChange = useCallback(
    (columnId: string, value: string) => {
      setLocalFilterInputs((prev) => ({ ...prev, [columnId]: value }));

      if (debounceRef.current[columnId]) {
        clearTimeout(debounceRef.current[columnId]);
      }

      debounceRef.current[columnId] = setTimeout(() => {
        const trimmed = value.trim();
        const current = columnFilters ?? [];
        const next = trimmed
          ? [...current.filter((f) => f.id !== columnId), { id: columnId, value: trimmed }]
          : current.filter((f) => f.id !== columnId);
        onColumnFiltersChange?.(next);
        // Reset page al filtrar
        onPageChange(1);
      }, 300);
    },
    [columnFilters, onColumnFiltersChange, onPageChange]
  );

  const handleRemoveFilter = useCallback(
    (columnId: string) => {
      setLocalFilterInputs((prev) => ({ ...prev, [columnId]: '' }));
      const current = columnFilters ?? [];
      onColumnFiltersChange?.(current.filter((f) => f.id !== columnId));
      onPageChange(1);
    },
    [columnFilters, onColumnFiltersChange, onPageChange]
  );

  const handleClearAllFilters = useCallback(() => {
    const cleared: Record<string, string> = {};
    table.getAllLeafColumns().forEach((col) => {
      cleared[col.id] = '';
    });
    setLocalFilterInputs(cleared);
    onColumnFiltersChange?.([]);
    onPageChange(1);
  }, [table, onColumnFiltersChange, onPageChange]);

  const activeFilters = useMemo(
    () => (columnFilters ?? []).filter((f) => f.value !== undefined && f.value !== ''),
    [columnFilters]
  );

  // ── Exportación ─────────────────────────────────────────────────────────
  const buildExportWorksheet = useCallback(() => {
    const exportData = getExportData ? getExportData() : data;

    // Construimos AOA (Array of Arrays) manualmente para poder
    // insertar una fila con el filtro aplicado arriba del header.
    const visibleColumns = columns.filter((c) => c.id !== 'actions');
    const headers = visibleColumns.map((c) =>
      typeof c.header === 'string' ? c.header : (c.id ?? String((c as any).accessorKey ?? ''))
    );

    const rows = exportData.map((row) =>
      visibleColumns.map((col) => {
        const key = (col as any).accessorKey as string | undefined;
        if (!key) return '';
        const parts = key.split('.');
        let val: any = row;
        for (const p of parts) {
          val = val?.[p];
        }
        return val ?? '';
      })
    );

    const aoa = exportFilterLabel
      ? [[`Filtrado por: ${exportFilterLabel}`], headers, ...rows]
      : [headers, ...rows];

    const worksheet = XLSX.utils.aoa_to_sheet(aoa);

    // Mergear la celda del filtro para que ocupe todo el ancho
    if (exportFilterLabel && headers.length > 1) {
      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
      ];
    }

    return worksheet;
  }, [data, getExportData, exportFilterLabel, columns]);

  const handleExportExcel = useCallback(() => {
    const worksheet = buildExportWorksheet();
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
    const fileName = exportFileName.endsWith('.xlsx')
      ? exportFileName
      : `${exportFileName}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }, [buildExportWorksheet, exportFileName]);

  const handleExportCsv = useCallback(() => {
    const worksheet = buildExportWorksheet();
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const baseName = exportFileName.replace(/\.(xlsx|csv)$/, '');
    link.href = URL.createObjectURL(blob);
    link.download = `${baseName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }, [buildExportWorksheet, exportFileName]);

  // ── Ir a página ───────────────────────────────────────────────────────────
  const [goToPage, setGoToPage] = useState('');
  const handleGoToPage = useCallback(() => {
    const page = parseInt(goToPage, 10);
    if (!isNaN(page) && page >= 1 && page <= pagination.totalPages) {
      onPageChange(page);
      setGoToPage('');
    }
  }, [goToPage, pagination.totalPages, onPageChange]);

  // ── Sorting helper ──────────────────────────────────────────────────────
  const getSortIcon = (columnId: string) => {
    const sort = sorting.find((s) => s.id === columnId);
    if (!sort) return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />;
    return sort.desc
      ? <ArrowDown className="ml-1 h-3 w-3 text-primary" />
      : <ArrowUp className="ml-1 h-3 w-3 text-primary" />;
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* ── Barra de herramientas ───────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2 flex-wrap">
        {activeFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAllFilters}
            disabled={isLoading}
            className="h-8 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Limpiar filtros
          </Button>
        )}

        {enableExport && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isLoading || data.length === 0}
              className="h-8 gap-1.5 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={isLoading || data.length === 0}
              className="h-8 gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" />
              CSV
            </Button>
          </>
        )}
      </div>

      {/* ── Badges de filtros activos ───────────────────────────────────── */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtros activos:</span>
          {activeFilters.map((filter) => {
            const col = table.getAllLeafColumns().find((c) => c.id === filter.id);
            const header = col?.columnDef.header;
            const label = typeof header === 'string'
              ? header
              : header
                ? flexRender(header, { column: col, header: col.getIsVisible() as any, table } as any)
                : filter.id;
            return (
              <Badge key={filter.id} variant="secondary" className="gap-1 pr-1 text-xs">
                {label}: {String(filter.value)}
                <button
                  onClick={() => handleRemoveFilter(filter.id)}
                  className="ml-1 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label={`Quitar filtro ${filter.id}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* ── Tabla ────────────────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-white overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando...
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as DataTableColumnMeta | undefined;
                  const canSort = enableSorting && header.column.getCanSort();
                  const showFilter =
                    enableColumnFilters &&
                    meta?.enableColumnFilter !== false &&
                    !header.isPlaceholder;

                  return (
                    <TableHead
                      key={header.id}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      <div className="flex flex-col gap-1.5 py-1">
                        {/* Header con sorting */}
                        <div
                          className={canSort ? 'flex items-center cursor-pointer select-none hover:text-foreground' : ''}
                          onClick={canSort ? () => header.column.toggleSorting() : undefined}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && getSortIcon(header.column.id)}
                        </div>

                        {/* Filtro por columna */}
                        {showFilter && (
                          <Input
                            placeholder={meta?.filterPlaceholder ?? 'Filtrar...'}
                            value={localFilterInputs[header.column.id] ?? ''}
                            onChange={(e) =>
                              handleFilterInputChange(header.column.id, e.target.value)
                            }
                            className="h-7 text-xs"
                            disabled={isLoading}
                          />
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-muted/30 transition-colors"
                  data-state={row.getIsSelected() && 'selected'}
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
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {isLoading ? 'Cargando...' : 'Sin resultados.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Paginación ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm">
        {/* Info + page size */}
        <div className="flex items-center gap-3">
          <p className="text-muted-foreground">
            {pagination.totalItems === 0 ? (
              '0 resultados'
            ) : (
              <>
                Mostrando{' '}
                <span className="font-medium text-foreground">
                  {(pagination.page - 1) * pagination.pageSize + 1}
                </span>
                –
                <span className="font-medium text-foreground">
                  {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}
                </span>{' '}
                de <span className="font-medium text-foreground">{pagination.totalItems}</span>
              </>
            )}
          </p>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">Filas</span>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(v) => onPageSizeChange?.(Number(v))}
              disabled={isLoading}
            >
              <SelectTrigger className="h-7 w-[60px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Controles de página */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={pagination.page <= 1 || isLoading}
            className="h-8 w-8 p-0"
            aria-label="Primera página"
            title="Primera página"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || isLoading}
            className="h-8 w-8 p-0"
            aria-label="Página anterior"
            title="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="px-3 text-xs font-medium tabular-nums">
            {pagination.page} / {pagination.totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || isLoading}
            className="h-8 w-8 p-0"
            aria-label="Página siguiente"
            title="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.totalPages)}
            disabled={pagination.page >= pagination.totalPages || isLoading}
            className="h-8 w-8 p-0"
            aria-label="Última página"
            title="Última página"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1.5 ml-2">
            <Input
              type="number"
              min={1}
              max={pagination.totalPages}
              placeholder="Ir a..."
              value={goToPage}
              onChange={(e) => setGoToPage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGoToPage();
              }}
              className="h-8 w-16 text-xs"
              disabled={isLoading}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoToPage}
              disabled={isLoading}
              className="h-8 px-2 text-xs"
            >
              Ir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
