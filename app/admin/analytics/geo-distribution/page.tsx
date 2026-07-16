'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { ArrowLeft, RotateCcw, Loader2, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PeruMap } from '@/components/admin/geo/PeruMap';
import { MapLegend } from '@/components/admin/geo/MapLegend';
import { GeoDataTable } from '@/components/admin/geo/GeoDataTable';
import type { GeoRegionData, MapLevel } from '@/components/admin/geo/PeruMap';

// ── Backend response types ──────────────────────────────────────────────────

interface ProvinceEntry {
  province_code: string;
  loan_count: number;
  percentage: number;
}

interface DepartmentEntry {
  region_code: string;
  loan_count: number;
  percentage: number;
  provinces: ProvinceEntry[];
}

interface GeoDistributionResponse {
  total_loans: number;
  departments: DepartmentEntry[];
}

interface CityEntry {
  city: string;       // código ubigeo de distrito (6 dígitos)
  loan_count: number;
  percentage: number;
}

interface CityDistributionResponse {
  cities: CityEntry[];
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function GeoDistributionPage() {
  const [data, setData] = useState<GeoDistributionResponse | null>(null);
  const [cityData, setCityData] = useState<CityDistributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Sincronización con el mapa
  const [mapLevel, setMapLevel] = useState<MapLevel>('pais');
  const [selectedDepCode, setSelectedDepCode] = useState<string | null>(null);
  const [selectedProvCode, setSelectedProvCode] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [geoRes, cityRes] = await Promise.all([
        fetch('/api/admin/kpis/geo-distribution'),
        fetch('/api/admin/kpis/city-distribution'),
      ]);
      if (!geoRes.ok) throw new Error(`${geoRes.status}`);
      setData(await geoRes.json());
      if (cityRes.ok) {
        setCityData(await cityRes.json());
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Transform data for the map component
  const mapData: GeoRegionData[] = useMemo(() => {
    if (!data) return [];
    const items: GeoRegionData[] = [];

    for (const dep of data.departments) {
      items.push({
        code: dep.region_code,
        loanCount: dep.loan_count,
        percentage: dep.percentage,
      });
      for (const prov of dep.provinces) {
        items.push({
          code: prov.province_code,
          loanCount: prov.loan_count,
          percentage: prov.percentage,
        });
      }
    }

    // Agregar data de distritos del city-distribution para el mapa
    if (cityData) {
      for (const city of cityData.cities) {
        // city.city es el código ubigeo de distrito (6 dígitos)
        if (city.city && city.city.length === 6) {
          items.push({
            code: city.city,
            loanCount: city.loan_count,
            percentage: city.percentage,
          });
        }
      }
    }

    return items;
  }, [data, cityData]);

  const maxLoanCount = useMemo(() => {
    if (!data || data.departments.length === 0) return 1;
    return Math.max(...data.departments.map((d) => d.loan_count));
  }, [data]);

  // Callback del mapa cuando cambia de nivel
  const handleLevelChange = useCallback((level: MapLevel, depCode: string | null, provCode: string | null) => {
    setMapLevel(level);
    setSelectedDepCode(depCode);
    setSelectedProvCode(provCode);
  }, []);

  // Tabla lateral — se adapta al nivel del mapa
  const tableData = useMemo(() => {
    if (!data) return [];

    if (mapLevel === 'provincia' && selectedProvCode) {
      // Nivel distrito: filtrar city-distribution por provincia (primeros 4 dígitos)
      if (!cityData) return [];
      const filtered = cityData.cities.filter(
        (c) => c.city && c.city.length === 6 && c.city.startsWith(selectedProvCode)
      );
      // Recalcular porcentaje sobre el total de la provincia
      const provTotal = filtered.reduce((sum, c) => sum + c.loan_count, 0);
      return filtered.map((c) => ({
        code: c.city,
        loanCount: c.loan_count,
        percentage: provTotal > 0 ? Math.round(c.loan_count * 1000 / provTotal) / 10 : 0,
      }));
    }

    if (mapLevel === 'departamento' && selectedDepCode) {
      // Mostrando provincias del departamento seleccionado
      const dep = data.departments.find((d) => d.region_code === selectedDepCode);
      if (!dep) return [];
      return dep.provinces.map((p) => ({
        code: p.province_code,
        loanCount: p.loan_count,
        percentage: p.percentage,
      }));
    }

    // Nivel país → mostrar departamentos
    return data.departments.map((d) => ({
      code: d.region_code,
      loanCount: d.loan_count,
      percentage: d.percentage,
    }));
  }, [data, cityData, mapLevel, selectedDepCode, selectedProvCode]);

  const tableLevel: 'department' | 'province' | 'district' = useMemo(() => {
    if (mapLevel === 'provincia' && selectedProvCode) return 'district';
    if (mapLevel === 'departamento' && selectedDepCode) return 'province';
    return 'department';
  }, [mapLevel, selectedDepCode, selectedProvCode]);

  const tableTitle = useMemo(() => {
    if (mapLevel === 'provincia' && selectedProvCode) {
      return 'Distritos';
    }
    if (mapLevel === 'departamento' && selectedDepCode) {
      const dep = data?.departments.find((d) => d.region_code === selectedDepCode);
      const depName = dep ? `(${dep.loan_count} préstamos)` : '';
      return `Provincias ${depName}`;
    }
    return 'Préstamos por Departamento';
  }, [mapLevel, selectedDepCode, selectedProvCode, data]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> KPIs
          </Link>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="gap-1"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
          Refrescar
        </Button>
      </div>

      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Distribución Geográfica</h1>
          <p className="text-sm text-muted-foreground">
            Mapa interactivo — click en un departamento para ver provincias, luego distritos.
            {data && (
              <span className="ml-1 font-medium text-foreground">
                Total: {data.total_loans} préstamos activos
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Content */}
      {loading && !data ? (
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      ) : error ? (
        <div className="h-96 rounded-lg border border-dashed flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground">Error al cargar datos geográficos</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reintentar
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Map (3/5 width on desktop) */}
          <div className="lg:col-span-3 space-y-3">
            <div className="h-[600px]">
              <PeruMap
                data={mapData}
                maxLoanCount={maxLoanCount}
                onLevelChange={handleLevelChange}
              />
            </div>
            <MapLegend maxValue={maxLoanCount} />
          </div>

          {/* Table (2/5 width on desktop) */}
          <div className="lg:col-span-2">
            <GeoDataTable
              data={tableData}
              level={tableLevel}
              title={tableTitle}
            />
          </div>
        </div>
      )}
    </div>
  );
}
