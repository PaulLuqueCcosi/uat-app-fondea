'use client';

import { useState, useCallback, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import type { CapitalKpi } from '@/modules/admin/admin-kpis.service';

/**
 * KPI #2 — Capital disponible para prestar. GET /api/v1/admin/dashboard-kpis/capital
 *
 * available = Fund.bankBalance — el saldo BANCARIO REAL sincronizado desde el banco,
 * NO un cálculo de "total_capital - deployed". Si la última sincronización con el
 * banco está desactualizada (hay un warning en el backend cuando pasan >30min sin
 * sync), este número puede no coincidir exacto con total_capital - deployed.
 * total_capital = Fund.capitalBase (capital total aportado al fondo).
 * deployed = SUM(principal) de créditos STANDARD activos (mismo cálculo que KPI #1).
 *
 * El semáforo de color (verde >30% libre, amarillo 15-30%, rojo <15%) se calcula
 * ACÁ en el frontend con `available/total_capital` — el backend no manda ningún
 * campo de "estado"/color, solo los 3 montos.
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
