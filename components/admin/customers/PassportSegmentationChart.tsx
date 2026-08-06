'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import { PieChart as PieChartIcon, Users } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import type { PassportSegmentationResponse, PassportSegmentationLevel } from '@/modules/admin/admin-customers.types';

// ── Colors por nivel (consistente con CreditsTableClient badges) ─────────────

const LEVEL_COLORS: Record<string, string> = {
  BRONCE: '#D97706',  // amber-600
  PLATA: '#6B7280',   // gray-500
  ORO: '#CA8A04',     // yellow-600
  MASTER: '#7C3AED',  // purple-600
};

const LEVEL_LABELS: Record<string, string> = {
  BRONCE: 'Bronce',
  PLATA: 'Plata',
  ORO: 'Oro',
  MASTER: 'Master',
};

// ── Componente ───────────────────────────────────────────────────────────────

export function PassportSegmentationChart() {
  const [data, setData] = useState<PassportSegmentationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/customers/analytics/passport-segmentation');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) return <MetricCardSkeleton className="h-[450px]" />;

  if (!data?.levels?.length) {
    return (
      <MetricCard
        icon={PieChartIcon}
        title="Segmentación por Pasaporte"
        onRefresh={fetchData}
        isRefreshing={loading && !!data}
      >
        <p className="text-sm text-muted-foreground text-center py-8">Sin datos de segmentación</p>
      </MetricCard>
    );
  }

  const chartData = data.levels.map((lvl: PassportSegmentationLevel) => ({
    name: LEVEL_LABELS[lvl.level] ?? lvl.level,
    value: lvl.client_count,
    percentage: lvl.percentage,
    level: lvl.level,
  }));

  return (
    <div className="space-y-6">
      {/* KPI total */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clientes activos con crédito vigente</p>
              <p className="text-3xl font-bold">{data.total_active_clients.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dona + detalle */}
      <MetricCard
        icon={PieChartIcon}
        title="Distribución por Nivel Pasaporte (R34)"
        description={`${data.total_active_clients} clientes activos`}
        onRefresh={fetchData}
        isRefreshing={loading && !!data}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dona */}
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={LEVEL_COLORS[entry.level] ?? '#94A3B8'} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [`${value} clientes`, '']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          {/* Barras de progreso vs meta */}
          <div className="space-y-4 flex flex-col justify-center">
            {data.levels.map((lvl: PassportSegmentationLevel) => {
              const color = LEVEL_COLORS[lvl.level] ?? '#94A3B8';
              const hasTarget = lvl.target_percentage !== null;
              return (
                <div key={lvl.level} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{LEVEL_LABELS[lvl.level] ?? lvl.level}</span>
                    <span className="text-xs text-muted-foreground">
                      {lvl.client_count} ({lvl.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  {/* Barra actual */}
                  <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all"
                      style={{ width: `${Math.min(lvl.percentage, 100)}%`, backgroundColor: color }}
                    />
                    {/* Marcador de meta */}
                    {hasTarget && (
                      <div
                        className="absolute inset-y-0 w-0.5 bg-red-500"
                        style={{ left: `${Math.min(lvl.target_percentage!, 100)}%` }}
                        title={`Meta: ${lvl.target_percentage}%`}
                      />
                    )}
                  </div>
                  {/* Label de meta */}
                  {hasTarget ? (
                    <p className="text-[10px] text-muted-foreground">
                      Meta: {lvl.target_percentage}%
                      {lvl.percentage >= lvl.target_percentage! ? (
                        <span className="text-emerald-600 ml-1">✓ Cumplida</span>
                      ) : (
                        <span className="text-amber-600 ml-1">
                          ({(lvl.target_percentage! - lvl.percentage).toFixed(1)}% por cubrir)
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground italic">Sin meta definida</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </MetricCard>
    </div>
  );
}
