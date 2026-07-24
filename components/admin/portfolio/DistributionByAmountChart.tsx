'use client';

import { useState, useCallback, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatRangesParam } from './utils';
import { getAmountBucketsConfigAction } from '@/app/actions/configuracion-generica.actions';
import type { DistributionByAmount } from './types';

const BAR_COLOR = '#00A1CD';

interface DistributionByAmountChartProps {
  configButton?: React.ReactNode;
}

export function DistributionByAmountChart({ configButton }: DistributionByAmountChartProps) {
  const [data, setData] = useState<DistributionByAmount | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const buckets = await getAmountBucketsConfigAction();
      const rangesParam = formatRangesParam(buckets);
      const res = await fetch(`/api/admin/kpis/portfolio/analytics/distribution-by-amount?ranges=${encodeURIComponent(rangesParam)}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) return <MetricCardSkeleton className="h-[380px]" />;

  if (!data?.buckets?.length) {
    return (
      <MetricCard
        icon={BarChart3}
        title="Distribución por Monto"
        onRefresh={fetchData}
        isRefreshing={loading && !!data}
        footer={configButton}
      >
        <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
      </MetricCard>
    );
  }

  return (
    <MetricCard
      icon={BarChart3}
      title="Distribución por Monto"
      description={`${data.total_loans} préstamos`}
      onRefresh={fetchData}
      isRefreshing={loading && !!data}
      footer={configButton}
    >
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data.buckets} margin={{ top: 5, right: 20, left: 20, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="range_label" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip formatter={(value) => [`${value} préstamos`, 'Cantidad']} />
          <Bar dataKey="loan_count" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </MetricCard>
  );
}
