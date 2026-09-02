'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList,
} from 'recharts';

interface GeoDepEntry {
  region_code: string;
  loan_count: number;
  percentage: number;
}

interface GeoDistributionData {
  total_loans: number;
  departments: GeoDepEntry[];
}

const DEP_NAMES: Record<string, string> = {
  '01': 'Amazonas', '02': 'Áncash', '03': 'Apurímac', '04': 'Arequipa',
  '05': 'Ayacucho', '06': 'Cajamarca', '07': 'Callao', '08': 'Cusco',
  '09': 'Huancavelica', '10': 'Huánuco', '11': 'Ica', '12': 'Junín',
  '13': 'La Libertad', '14': 'Lambayeque', '15': 'Lima', '16': 'Loreto',
  '17': 'Madre de Dios', '18': 'Moquegua', '19': 'Pasco', '20': 'Piura',
  '21': 'Puno', '22': 'San Martín', '23': 'Tacna', '24': 'Tumbes', '25': 'Ucayali',
};

function getBarColor(index: number, total: number): string {
  if (total <= 1) return '#00A1CD';
  const colors = ['#005F7A', '#006E8F', '#0087AD', '#00A1CD', '#40C4E8', '#7DD8F0', '#B2ECF8'];
  const ratio = index / (total - 1);
  const idx = Math.min(Math.floor(ratio * (colors.length - 1)), colors.length - 1);
  return colors[idx];
}

/**
 * KPI #12 — Distribución geográfica. GET /api/v1/admin/dashboard-kpis/geo-distribution
 *
 * ✅ Datos reales (corregido 2026-08-18) — `KpiService.getGeoDistribution()`
 * lee de `KpiCreditDataPort.getGeoDistributionByDepartment/ByProvince`
 * (conectado a `credit`), ya no devuelve la lista mock hardcodeada. Las
 * provincias se agrupan bajo su departamento por prefijo de código ubigeo.
 * Solo créditos `credit_type=STANDARD` con `ubigeo_region`/`ubigeo_province`
 * cargado aparecen acá — en dev la mayoría de créditos de prueba no tienen
 * ubigeo, así que es normal ver pocos departamentos.
 */
export function CityDistributionKpiCard() {
  const [data, setData] = useState<GeoDistributionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/kpis/geo-distribution');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) return <MetricCardSkeleton />;
  if (!data) return null;

  const chartData = data.departments.map((dep) => ({
    name: DEP_NAMES[dep.region_code] ?? dep.region_code,
    prestamos: dep.loan_count,
    label: `${dep.loan_count} (${dep.percentage}%)`,
  }));

  const chartHeight = Math.max(180, chartData.length * 40 + 10);

  return (
    <MetricCard
      icon={MapPin}
      title="Distribución Geográfica"
      metricKey="cityDistribution"
      description={`${data.total_loans.toLocaleString()} préstamos activos · ${data.departments.length} departamentos`}
      onRefresh={fetchData}
      isRefreshing={loading && !!data}
      footer={
        <Link href="/admin/analytics/geo-distribution">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
            Ver mapa <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      }
    >
      {data.departments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 90, left: 5, bottom: 5 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={85}
              tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <Bar dataKey="prestamos" radius={[0, 4, 4, 0]} barSize={24}>
              {chartData.map((_entry, index) => (
                <Cell key={index} fill={getBarColor(index, chartData.length)} />
              ))}
              <LabelList
                dataKey="label"
                position="right"
                style={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </MetricCard>
  );
}
