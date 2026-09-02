'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/admin/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Search, RefreshCw, Loader2, Filter, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { getDepartments, getProvinces, getDistricts } from 'ubigeo-fns';
import type { AdminCreditRow } from '@/modules/admin/admin-credits.service';
import {
  CREDIT_STATUS_INFO,
  CREDIT_STATUS_ORDER,
  creditStatusInfo,
} from '@/modules/admin/credit-status-labels';
import { InfoPopover } from '@/components/admin/shared/InfoPopover';
import { INTEREST_RATE_INFO } from './credits-help-content';

// Labels y colores centralizados en `modules/admin/credit-status-labels` — el Record que
// estaba acá usaba colores arbitrarios (emerald/amber/gray) en vez de los tokens de la
// paleta, y las etiquetas ya diferían de las otras vistas de admin.

// ── Ubigeo resolver ────────────────────────────────────────────────────────

function resolveUbigeoName(region?: string | null, province?: string | null, district?: string | null): string {
  if (!region && !province && !district) return '—';
  try {
    if (district) {
      const provCode = district.substring(0, 4);
      const dists = getDistricts(provCode);
      const distName = dists.find(d => d.code === district)?.name;
      if (distName) return distName;
    }
    if (province) {
      const regCode = province.substring(0, 2);
      const provs = getProvinces(regCode);
      const provName = provs.find(p => p.code === province)?.name;
      if (provName) return provName;
    }
    if (region) {
      const deps = getDepartments();
      const depName = deps.find(d => d.code === region)?.name;
      if (depName) return depName;
    }
  } catch { /* fallback */ }
  return district || province || region || '—';
}

// ── Columnas ───────────────────────────────────────────────────────────────

const columns = [
  {
    accessorKey: 'creditCode',
    header: 'Código',
    cell: ({ row }: { row: { original: AdminCreditRow } }) => (
      <Link
        href={`/admin/credits/${row.original.id}`}
        className="font-mono text-[10px] text-muted-foreground hover:text-primary transition-colors"
      >
        {row.original.creditCode ?? `#${row.original.id.slice(0, 6)}`}
      </Link>
    ),
  },
  {
    accessorKey: 'clientName',
    header: 'Cliente',
    cell: ({ row }: { row: { original: AdminCreditRow } }) => {
      const name = row.original.clientName;
      const doc = row.original.clientDocument;
      return (
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-medium text-sm truncate max-w-[150px]">
            {name || 'Sin nombre'}
          </span>
          {doc && (
            <span className="font-mono text-[10px] text-muted-foreground">{doc}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'principal',
    header: 'Monto',
    cell: ({ row }: { row: { original: AdminCreditRow } }) => (
      <span className="text-xs font-semibold">S/ {row.original.principal.toFixed(0)}</span>
    ),
  },
  {
    accessorKey: 'disbursedAt',
    header: 'Desembolso',
    cell: ({ row }: { row: { original: AdminCreditRow } }) => (
      <span className="text-[11px] text-muted-foreground">
        {row.original.disbursedAt
          ? new Date(row.original.disbursedAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
          : '—'}
      </span>
    ),
  },
  {
    accessorKey: 'maturityDate',
    header: 'Vence',
    cell: ({ row }: { row: { original: AdminCreditRow } }) => {
      const d = row.original.maturityDate;
      if (!d) return <span className="text-[11px] text-muted-foreground">—</span>;
      const date = new Date(d + 'T00:00:00'); // forzar parseo local para LocalDate ISO
      return (
        <span className="text-[11px] text-muted-foreground">
          {isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
        </span>
      );
    },
  },
  {
    // `days_remaining` del backend es solo `maturityDate − hoy` (ver
    // PortfolioCreditListService.calculateDaysRemaining). NO es mora: la mora es a nivel
    // de cuota (`days_overdue`) y el estado del crédito ya la refleja. Antes esta celda
    // decía "10d mora" en créditos ACTIVE sin ninguna cuota vencida — contradecía al badge
    // de estado de la fila de al lado.
    accessorKey: 'daysRemaining',
    header: 'Al vencimiento',
    cell: ({ row }: { row: { original: AdminCreditRow } }) => {
      const days = row.original.daysRemaining;
      const status = row.original.status;
      if (!row.original.maturityDate) return <span className="text-xs text-muted-foreground">—</span>;
      if (status === 'PAID_OFF') return <span className="text-xs text-muted-foreground">Cerrado</span>;
      if (days > 0) return <span className="text-xs text-success-700 font-medium">Faltan {days}d</span>;
      if (days === 0) return <span className="text-xs text-warning-700 font-medium">Vence hoy</span>;
      return (
        <span className="text-xs text-error-700 font-medium">
          Venció hace {Math.abs(days)}d
        </span>
      );
    },
  },
  {
    accessorKey: 'pendingBalance',
    header: 'Pendiente',
    cell: ({ row }: { row: { original: AdminCreditRow } }) => (
      <span className="text-xs font-mono">
        S/ {(row.original.pendingBalance ?? 0).toFixed(0)}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }: { row: { original: AdminCreditRow } }) => {
      const cfg = creditStatusInfo(row.original.status);
      return (
        <span
          title={cfg.description}
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${cfg.chipClass}`}
        >
          {cfg.label}
        </span>
      );
    },
  },
  {
    accessorKey: 'termDays',
    header: 'Plazo',
    cell: ({ row }: { row: { original: AdminCreditRow } }) => (
      <span className="text-[11px] text-muted-foreground">{row.original.termDays}d</span>
    ),
  },
  {
    accessorKey: 'ubigeoDistrict',
    header: 'Ubicación',
    cell: ({ row }: { row: { original: AdminCreditRow } }) => {
      const { ubigeoRegion, ubigeoProvince, ubigeoDistrict } = row.original;
      const location = resolveUbigeoName(ubigeoRegion, ubigeoProvince, ubigeoDistrict);
      // Resolver departamento para mostrar abajo
      let depName = '';
      if (ubigeoRegion) {
        try {
          const deps = getDepartments();
          depName = deps.find(d => d.code === ubigeoRegion)?.name ?? '';
        } catch { /* */ }
      }
      return (
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[11px] font-medium truncate max-w-[100px]">{location}</span>
          {depName && location !== depName && (
            <span className="text-[9px] text-muted-foreground">{depName}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'interestRate',
    header: () => (
      <div className="flex items-center gap-1">
        <span>Tasa</span>
        <InfoPopover {...INTEREST_RATE_INFO} />
      </div>
    ),
    cell: ({ row }: { row: { original: AdminCreditRow } }) => (
      <span className="text-[11px] font-mono">{row.original.interestRate}%</span>
    ),
  },
  {
    accessorKey: 'fondeaScore',
    header: 'Score',
    cell: ({ row }: { row: { original: AdminCreditRow } }) => (
      <span className="text-[11px] font-mono text-muted-foreground">
        {row.original.fondeaScore ?? '—'}
      </span>
    ),
  },
  {
    accessorKey: 'passportPoints',
    header: 'Pasaporte',
    cell: ({ row }: { row: { original: AdminCreditRow } }) => {
      const pts = row.original.passportPoints;
      if (pts == null) return <span className="text-[11px] text-muted-foreground">—</span>;
      let level = 'Bronce';
      let color = 'text-amber-700 bg-amber-50';
      if (pts > 600) { level = 'Master'; color = 'text-purple-700 bg-purple-50'; }
      else if (pts > 400) { level = 'Oro'; color = 'text-yellow-700 bg-yellow-50'; }
      else if (pts > 200) { level = 'Plata'; color = 'text-gray-600 bg-gray-100'; }
      return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${color}`}>
          {level}
        </span>
      );
    },
  },
];

// ── Componente ─────────────────────────────────────────────────────────────

interface CreditsTableClientProps {
  data: AdminCreditRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  /**
   * Prefijo para los query params (q, status, page, size, etc.) — permite montar
   * dos instancias de esta tabla en la misma página (ej. tabs "Créditos"/"Negociación")
   * sin que los filtros de una pisen los de la otra en la URL.
   */
  paramPrefix?: string;
}

export function CreditsTableClient({ data, pagination, paramPrefix = '' }: CreditsTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const p = useCallback((key: string) => `${paramPrefix}${key}`, [paramPrefix]);

  const [search, setSearch] = useState(searchParams.get(p('q')) ?? '');
  const [isPending, startTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(() => {
    return !!(searchParams.get(p('disbursed_from')) || searchParams.get(p('disbursed_to')) ||
      searchParams.get(p('overdue_only')) || searchParams.get(p('term_days')) ||
      searchParams.get(p('min_amount')) || searchParams.get(p('max_amount')) ||
      searchParams.get(p('min_days_mora')) || searchParams.get(p('passport_level')) ||
      searchParams.get(p('city')));
  });

  const activeFilterCount = [
    searchParams.get(p('disbursed_from')), searchParams.get(p('disbursed_to')),
    searchParams.get(p('overdue_only')), searchParams.get(p('term_days')),
    searchParams.get(p('min_amount')), searchParams.get(p('max_amount')),
    searchParams.get(p('min_days_mora')), searchParams.get(p('passport_level')),
    searchParams.get(p('city')),
  ].filter(Boolean).length;

  const updateUrl = useCallback(
    (params: URLSearchParams) => {
      startTransition(() => { router.push(`/admin/credits?${params.toString()}`); });
    }, [router]
  );

  const applyFilters = useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(p('page'), '1');
      for (const [key, val] of Object.entries(patch)) {
        if (val != null && val !== '') params.set(p(key), val);
        else params.delete(p(key));
      }
      updateUrl(params);
    }, [searchParams, updateUrl, p]
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout((window as any).__creditSearchTimeout);
    (window as any).__creditSearchTimeout = setTimeout(() => {
      applyFilters({ q: value.trim() || undefined });
    }, 400);
  };

  const handlePageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(p('page'), String(newPage));
    updateUrl(params);
  }, [searchParams, updateUrl, p]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(p('size'), String(newSize));
    params.set(p('page'), '1');
    updateUrl(params);
  }, [searchParams, updateUrl, p]);

  const clearAllFilters = useCallback(() => {
    setSearch('');
    const params = new URLSearchParams(searchParams.toString());
    // Solo limpia las claves de ESTA instancia — no toca el tab activo ni los
    // filtros de la otra tabla si comparten la misma página.
    ['q', 'status', 'term_days', 'passport_level', 'city', 'min_amount', 'max_amount',
      'min_days_mora', 'disbursed_from', 'disbursed_to', 'overdue_only']
      .forEach((key) => params.delete(p(key)));
    params.set(p('page'), '1');
    updateUrl(params);
  }, [searchParams, updateUrl, p]);

  const currentStatus = searchParams.get(p('status')) ?? '';

  return (
    <div className="space-y-4">
      {/* Buscador + Estado + Refrescar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar DNI, nombre o ID..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            disabled={isPending}
            className="pl-9 h-9"
          />
        </div>

        <NativeSelect
          value={currentStatus}
          onChange={(e) => applyFilters({ status: e.target.value || undefined })}
          className="h-9 w-36"
          disabled={isPending}
        >
          <NativeSelectOption value="">Todos</NativeSelectOption>
          {/* Derivado del enum — antes faltaba PENDING_DISBURSEMENT, así que los créditos
              sin desembolsar no se podían filtrar. */}
          {CREDIT_STATUS_ORDER.map((status) => (
            <NativeSelectOption key={status} value={status}>
              {CREDIT_STATUS_INFO[status].label}
            </NativeSelectOption>
          ))}
        </NativeSelect>

        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleTrigger
            render={<Button variant="outline" size="sm" className="h-9 gap-2" type="button" disabled={isPending} />}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge variant="default" className="h-5 min-w-5 px-1 text-[10px]">{activeFilterCount}</Badge>
            )}
            {filtersOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </CollapsibleTrigger>
        </Collapsible>

        {(activeFilterCount > 0 || currentStatus || search) && (
          <Button variant="ghost" size="sm" className="h-9 gap-1 text-xs" onClick={clearAllFilters} disabled={isPending}>
            <X className="h-3.5 w-3.5" /> Limpiar
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={() => startTransition(() => router.refresh())} disabled={isPending} className="h-9 ml-auto gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualizar
        </Button>
      </div>

      {/* Panel filtros avanzados */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleContent>
          <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Plazo</Label>
                <NativeSelect
                  value={searchParams.get(p('term_days')) ?? ''}
                  onChange={(e) => applyFilters({ term_days: e.target.value || undefined })}
                  className="h-8 text-sm" disabled={isPending}
                >
                  <NativeSelectOption value="">Todos</NativeSelectOption>
                  <NativeSelectOption value="7">7 días</NativeSelectOption>
                  <NativeSelectOption value="15">15 días</NativeSelectOption>
                  <NativeSelectOption value="30">30 días</NativeSelectOption>
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nivel Pasaporte</Label>
                <NativeSelect
                  value={searchParams.get(p('passport_level')) ?? ''}
                  onChange={(e) => applyFilters({ passport_level: e.target.value || undefined })}
                  className="h-8 text-sm" disabled={isPending}
                >
                  <NativeSelectOption value="">Todos</NativeSelectOption>
                  <NativeSelectOption value="BRONCE">Bronce (0-200)</NativeSelectOption>
                  <NativeSelectOption value="PLATA">Plata (201-400)</NativeSelectOption>
                  <NativeSelectOption value="ORO">Oro (401-600)</NativeSelectOption>
                  <NativeSelectOption value="MASTER">Master (601+)</NativeSelectOption>
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Ciudad (Dpto.)</Label>
                <NativeSelect
                  value={searchParams.get(p('city')) ?? ''}
                  onChange={(e) => applyFilters({ city: e.target.value || undefined })}
                  className="h-8 text-sm" disabled={isPending}
                >
                  <NativeSelectOption value="">Todas</NativeSelectOption>
                  <NativeSelectOption value="04">Arequipa</NativeSelectOption>
                  <NativeSelectOption value="15">Lima</NativeSelectOption>
                  <NativeSelectOption value="08">Cusco</NativeSelectOption>
                  <NativeSelectOption value="13">La Libertad</NativeSelectOption>
                  <NativeSelectOption value="20">Piura</NativeSelectOption>
                  <NativeSelectOption value="06">Cajamarca</NativeSelectOption>
                  <NativeSelectOption value="11">Ica</NativeSelectOption>
                  <NativeSelectOption value="12">Junín</NativeSelectOption>
                  <NativeSelectOption value="21">Puno</NativeSelectOption>
                  <NativeSelectOption value="14">Lambayeque</NativeSelectOption>
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Monto mínimo</Label>
                <Input type="number" placeholder="S/ min" defaultValue={searchParams.get(p('min_amount')) ?? ''}
                  className="h-8 text-sm" disabled={isPending}
                  onChange={(e) => applyFilters({ min_amount: e.target.value || undefined })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Monto máximo</Label>
                <Input type="number" placeholder="S/ max" defaultValue={searchParams.get(p('max_amount')) ?? ''}
                  className="h-8 text-sm" disabled={isPending}
                  onChange={(e) => applyFilters({ max_amount: e.target.value || undefined })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Días mora mín.</Label>
                <Input type="number" placeholder="Ej: 5" defaultValue={searchParams.get(p('min_days_mora')) ?? ''}
                  className="h-8 text-sm" disabled={isPending}
                  onChange={(e) => applyFilters({ min_days_mora: e.target.value || undefined })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Desembolsado desde</Label>
                <Input type="date" defaultValue={searchParams.get(p('disbursed_from')) ?? ''}
                  className="h-8 text-sm" disabled={isPending}
                  onChange={(e) => applyFilters({ disbursed_from: e.target.value || undefined })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Desembolsado hasta</Label>
                <Input type="date" defaultValue={searchParams.get(p('disbursed_to')) ?? ''}
                  className="h-8 text-sm" disabled={isPending}
                  onChange={(e) => applyFilters({ disbursed_to: e.target.value || undefined })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Solo en mora</Label>
                <NativeSelect
                  value={searchParams.get(p('overdue_only')) ?? ''}
                  onChange={(e) => applyFilters({ overdue_only: e.target.value || undefined })}
                  className="h-8 text-sm" disabled={isPending}
                >
                  <NativeSelectOption value="">Todos</NativeSelectOption>
                  <NativeSelectOption value="true">Solo en mora</NativeSelectOption>
                </NativeSelect>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Tabla */}
      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        exportFileName="cartera-prestamos.xlsx"
        getExportData={() => data}
        enableExport={true}
        isLoading={isPending}
        onRowClick={(row) => router.push(`/admin/credits/${row.id}`)}
      />
    </div>
  );
}
