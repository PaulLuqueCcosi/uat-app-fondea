'use client';

import { useState, useCallback, useEffect } from 'react';
import { PieChart } from 'lucide-react';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import type { DistributionByTerm, TermSegment } from './types';

const PIE_COLORS = ['#005F7A', '#00A1CD', '#7DD8F0', '#B2ECF8'];

export function DistributionByTermChart() {
  const [data, setData] = useState<DistributionByTerm | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/kpis/portfolio/analytics/distribution-by-term');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) return <MetricCardSkeleton className="h-[350px]" />;

  if (!data?.segments?.length) {
    return (
      <MetricCard
        icon={PieChart}
        title="Distribución por Plazo"
        onRefresh={fetchData}
        isRefreshing={loading && !!data}
      >
        <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
      </MetricCard>
    );
  }

  return (
    <MetricCard
      icon={PieChart}
      title="Distribución por Plazo"
      description={`${data.total_loans} préstamos · S/ ${data.total_principal.toLocaleString()}`}
      onRefresh={fetchData}
      isRefreshing={loading && !!data}
    >
      <ResponsiveContainer width="100%" height={250}>
        <RechartsPie>
          <Pie
            data={data.segments.map((s: TermSegment) => ({
              name: `${s.term_days}d`,
              value: s.loan_count,
              pct: s.percentage,
            }))}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            dataKey="value"
            label={(entry: PieLabelRenderProps & { pct?: number }) =>
              `${entry.name ?? ''}: ${entry.pct ?? 0}%`
            }
          >
            {data.segments.map((_s: TermSegment, i: number) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} préstamos`, '']} />
          <Legend />
        </RechartsPie>
      </ResponsiveContainer>
    </MetricCard>
  );
}
