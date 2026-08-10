'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { RotateCcw, Loader2, MapPin, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PeruMap } from '@/components/admin/geo/PeruMap';
import type { GeoRegionData, MapLevel, ColorScheme } from '@/components/admin/geo/PeruMap';
import { getDepartments, getProvinces, getDistricts } from 'ubigeo-fns';
import { cn } from '@/lib/utils';

// ── Types ───────────────────────────────────────────────────────────────────

interface CityNplEntry {
  ubigeo_region: string;
  city_name: string;
  active_loans: number;
  overdue_loans: number;
  npl_rate: number;
  share_of_total_overdue: number;
}

interface NplByCityResponse {
  cities: CityNplEntry[];
  total_active_loans: number;
  total_overdue_loans: number;
  total_npl_rate: number;
}

// ── Component ───────────────────────────────────────────────────────────────

export function NplGeoMap() {
  const [data, setData] = useState<NplByCityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<MapLevel>('pais');

  const fetchData = useCallback(async (mapLevel?: MapLevel, parentCode?: string | null) => {
    setLoading(true);
    setError(false);
    try {
      const level = mapLevel === 'departamento' ? 'province' : mapLevel === 'provincia' ? 'district' : 'region';
      const params = new URLSearchParams({ level });
      if (parentCode) params.set('parentCode', parentCode);

      const url = `/api/admin/collections/analytics/npl-by-city-mock?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status}`);
      const json: NplByCityResponse = await res.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Map data transform ──────────────────────────────────────────────────
  // IMPORTANTE: Incluir TODAS las regiones (incluso con 0% NPL)
  // El mapa necesita data para todos los codes para pintar verde las regiones sin mora
  const mapData: GeoRegionData[] = useMemo(() => {
    if (!data) return [];
    return data.cities
      .filter((city) => city.ubigeo_region)
      .map((city) => ({
        code: city.ubigeo_region,
        loanCount: city.npl_rate,
        percentage: city.npl_rate,
      }));
  }, [data]);

  const maxNplRate = useMemo(() => {
    if (!data || data.cities.length === 0) return 15;
    return Math.max(...data.cities.map((c) => c.npl_rate), 15);
  }, [data]);

  // Esquema de colores alineado con leyenda: emerald(0-5%) → lime(5-8%) → amber(8-12%) → red(>12%)
  const nplColorScheme: ColorScheme = useMemo(() => ({
    colors: ['#10b981', '#84cc16', '#f59e0b', '#ef4444'],
    domain: [0, 5, 8, 12],
  }), []);

  // ── Level change callback ───────────────────────────────────────────────
  const handleLevelChange = useCallback((level: MapLevel, depCode: string | null, provCode: string | null) => {
    setCurrentLevel(level);
  }, []);

  // ── Region click — dispara la recarga de datos para drill-down ──────────
  const handleRegionClick = useCallback((code: string, _name: string, clickedLevel: MapLevel) => {
    if (clickedLevel === 'pais') {
      fetchData('departamento', code);
    } else if (clickedLevel === 'departamento') {
      fetchData('provincia', code);
    }
  }, [fetchData]);

  // ── Name resolution ─────────────────────────────────────────────────────
  const getRegionName = useCallback((code: string): string => {
    if (currentLevel === 'pais') {
      return getDepartments().find((d) => d.code === code)?.name || code;
    }
    if (currentLevel === 'departamento') {
      const depCode = code.substring(0, 2);
      return getProvinces(depCode).find((p) => p.code === code)?.name || code;
    }
    const provCode = code.substring(0, 4);
    return getDistricts(provCode).find((d) => d.code === code)?.name || code;
  }, [currentLevel]);

  const levelLabel = useMemo(() => {
    if (currentLevel === 'pais') return 'Departamento';
    if (currentLevel === 'departamento') return 'Provincia';
    return 'Distrito';
  }, [currentLevel]);

  // ── NPL classification helpers (alineados con la leyenda del mapa) ────────
  // Mapa: emerald(0-5%) → lime(5-8%) → amber(8-12%) → red(>12%)
  const getNplColor = (nplRate: number) => {
    if (nplRate <= 5) return 'text-emerald-600';
    if (nplRate <= 8) return 'text-lime-600';
    if (nplRate <= 12) return 'text-amber-700';
    return 'text-red-600';
  };

  const getNplBg = (nplRate: number) => {
    if (nplRate <= 5) return 'bg-emerald-50 border-emerald-200';
    if (nplRate <= 8) return 'bg-lime-50 border-lime-200';
    if (nplRate <= 12) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  const getNplLabel = (nplRate: number) => {
    if (nplRate === 0) return 'Sin mora';
    if (nplRate <= 5) return 'Bajo';
    if (nplRate <= 8) return 'Moderado';
    if (nplRate <= 12) return 'Alto';
    return 'Crítico';
  };

  // ── Sorted cities list ──────────────────────────────────────────────────
  const sortedCities = useMemo(() => {
    if (!data) return [];
    return [...data.cities]
      .filter((c) => c.ubigeo_region)
      .sort((a, b) => b.npl_rate - a.npl_rate);
  }, [data]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <MapPin className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">NPL por {levelLabel}</h2>
            <p className="text-xs text-muted-foreground">
              Click en el mapa o en el listado para explorar
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData()}
          disabled={loading}
          className="gap-1.5"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
          Refrescar
        </Button>
      </div>

      {/* KPI Cards */}
      {data && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Activos</p>
            <p className="text-2xl font-bold mt-0.5">{data.total_active_loans.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">En mora</p>
            <p className="text-2xl font-bold mt-0.5 text-red-600">{data.total_overdue_loans.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">NPL Total</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-2xl font-bold">{data.total_npl_rate.toFixed(1)}%</p>
              <span className={cn('text-xs font-medium', getNplColor(data.total_npl_rate))}>
                {getNplLabel(data.total_npl_rate)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {loading && !data ? (
        <div className="h-96 bg-muted/50 animate-pulse rounded-lg" />
      ) : error ? (
        <div className="h-96 rounded-lg border border-dashed flex flex-col items-center justify-center gap-3">
          <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Error al cargar datos de NPL</p>
          <Button variant="outline" size="sm" onClick={() => fetchData()}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reintentar
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Mapa (3/5) */}
          <div className="lg:col-span-3 space-y-2">
            <div className="h-150">
              <PeruMap
                data={mapData}
                maxLoanCount={maxNplRate}
                onLevelChange={handleLevelChange}
                onRegionClick={handleRegionClick}
                colorScheme={nplColorScheme}
                renderTooltip={(name, regionData) => {
                  const city = data?.cities.find((c) => c.ubigeo_region === regionData?.code);
                  return (
                    <div className="p-2.5 space-y-1">
                      <p className="font-semibold text-sm">{name}</p>
                      {city ? (
                        <>
                          <p className={cn('text-xs font-medium', getNplColor(city.npl_rate))}>
                            NPL: {city.npl_rate.toFixed(1)}%
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {city.overdue_loans} en mora / {city.active_loans} activos
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">Sin datos</p>
                      )}
                    </div>
                  );
                }}
              />
            </div>
            {/* Leyenda */}
            <div className="flex items-center justify-center gap-5 py-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span className="text-[11px] text-muted-foreground">0-5% Bajo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-lime-500" />
                <span className="text-[11px] text-muted-foreground">5-8% Moderado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-amber-500" />
                <span className="text-[11px] text-muted-foreground">8-12% Alto</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-red-500" />
                <span className="text-[11px] text-muted-foreground">&gt;12% Crítico</span>
              </div>
            </div>
          </div>

          {/* Panel lateral — LISTADO COMPLETO (2/5) */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-card">
              <div className="px-4 py-3 border-b">
                <h3 className="text-sm font-semibold">Listado NPL — {levelLabel}s</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {sortedCities.length} {levelLabel.toLowerCase()}s · ordenado por NPL
                </p>
              </div>
              <div className="max-h-[580px] overflow-y-auto divide-y">
                {sortedCities.map((city) => {
                  const name = getRegionName(city.ubigeo_region);
                  return (
                    <div
                      key={city.ubigeo_region}
                      className="flex items-center gap-3 px-4 py-2.5 border-l-2 border-l-transparent"
                    >
                      {/* NPL badge */}
                      <div className={cn(
                        'w-12 text-center py-0.5 rounded text-[11px] font-bold border',
                        getNplBg(city.npl_rate),
                        getNplColor(city.npl_rate)
                      )}>
                        {city.npl_rate.toFixed(1)}%
                      </div>

                      {/* Name + details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">
                            {city.overdue_loans}/{city.active_loans} créditos
                          </span>
                          {city.share_of_total_overdue > 0 && (
                            <span className="text-[10px] text-muted-foreground/70">
                              · {city.share_of_total_overdue.toFixed(1)}% del total
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
