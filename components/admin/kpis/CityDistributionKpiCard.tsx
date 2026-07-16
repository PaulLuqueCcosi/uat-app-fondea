'use client';

import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KpiCard } from './KpiWrapper';
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

export function CityDistributionKpiCard() {
  return (
    <KpiCard<GeoDistributionData>
      endpoint="/geo-distribution"
      errorLabel="Distribución geográfica"
      render={(data) => {
        const chartData = data.departments.map((dep) => ({
          name: DEP_NAMES[dep.region_code] ?? dep.region_code,
          prestamos: dep.loan_count,
          label: `${dep.loan_count} (${dep.percentage}%)`,
        }));

        const chartHeight = Math.max(180, chartData.length * 40 + 10);

        return (
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm leading-tight">Distribución Geográfica</CardTitle>
                  <p className="text-[11px] text-muted-foreground">
                    {data.total_loans.toLocaleString()} préstamos activos · {data.departments.length} departamentos
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 shrink-0" render={<Link href="/admin/analytics/geo-distribution" />}>
                Ver mapa <ArrowRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
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
            </CardContent>
          </Card>
        );
      }}
    />
  );
}
