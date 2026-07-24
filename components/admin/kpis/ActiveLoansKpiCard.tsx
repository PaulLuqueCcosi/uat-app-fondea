'use client';

import { useState, useCallback, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import type { ActiveLoansKpi } from '@/modules/admin/admin-kpis.service';

/**
 * KPI 1: Préstamos activos — Número grande + monto S/ debajo.
 * TODO: Agregar gráfico de línea cuando haya datos históricos por día.
 */
export function ActiveLoansKpiCard() {
  const [data, setData] = useState<ActiveLoansKpi | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/kpis/active-loans');
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

  return (
    <MetricCard
      icon={TrendingUp}
      title="Préstamos activos"
      onRefresh={fetchData}
      isRefreshing={loading && !!data}
    >
      <p className="text-4xl font-bold">{data.count}</p>
      <p className="text-sm text-muted-foreground mt-2">
        S/ {data.total_principal.toLocaleString()} colocados
      </p>
    </MetricCard>
  );
}
