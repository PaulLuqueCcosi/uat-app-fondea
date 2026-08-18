'use client';

import { useState, useCallback, useEffect } from 'react';
import { Gauge } from 'lucide-react';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import type { CapitalKpi } from '@/modules/admin/admin-kpis.service';

/**
 * KPI #3 — Tasa de utilización de cartera. GET /api/v1/admin/dashboard-kpis/capital
 * (mismo endpoint que KPI #2 — comparte el campo `utilization_rate` de la respuesta).
 *
 * utilization_rate = deployed / capitalBase × 100, calculado en el backend
 * (Fund.calculateUtilizationRate). Si es muy bajo, la cartera no está rotando bien
 * (mucho capital ocioso sin prestar).
 */
export function UtilizacionKpiCard() {
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

  const rate = data.utilization_rate;
  const gaugeColor = rate >= 70 ? 'text-emerald-500' : rate >= 40 ? 'text-amber-500' : 'text-red-500';
  const circumference = 163.36;
  const dashLength = (rate / 100) * circumference;

  return (
    <MetricCard
      icon={Gauge}
      title="Tasa de utilización"
      onRefresh={fetchData}
      isRefreshing={loading && !!data}
    >
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32" cy="32" r="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              className="text-muted"
            />
            <circle
              cx="32" cy="32" r="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${dashLength} ${circumference}`}
              className={gaugeColor}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold">{rate}%</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          S/ {data.deployed.toLocaleString()} / S/ {data.total_capital.toLocaleString()}
        </p>
      </div>
    </MetricCard>
  );
}
