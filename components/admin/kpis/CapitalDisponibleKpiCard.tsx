'use client';

import { useState, useCallback, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import type { CapitalKpi } from '@/modules/admin/admin-kpis.service';

/**
 * KPI 2: Capital disponible para prestar — Número S/ con semáforo.
 * Semáforo: verde si >30% libre, amarillo 15-30%, rojo <15%.
 */
export function CapitalDisponibleKpiCard() {
  const [data, setData] = useState<CapitalKpi | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/kpis/capital');
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

  const availablePercent = data.total_capital > 0
    ? (data.available / data.total_capital) * 100
    : 0;

  // Semáforo
  let semaphoreColor = 'bg-emerald-500'; // verde
  let textColor = 'text-emerald-600';
  if (availablePercent < 15) {
    semaphoreColor = 'bg-red-500';
    textColor = 'text-red-600';
  } else if (availablePercent < 30) {
    semaphoreColor = 'bg-amber-500';
    textColor = 'text-amber-600';
  }

  return (
    <MetricCard
      icon={Wallet}
      title="Capital disponible"
      onRefresh={fetchData}
      isRefreshing={loading && !!data}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${semaphoreColor}`} />
      </div>
      <p className={`text-3xl font-bold ${textColor}`}>
        S/ {data.available.toLocaleString()}
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        S/ {data.total_capital.toLocaleString()} - S/ {data.deployed.toLocaleString()} colocados
      </p>
    </MetricCard>
  );
}
