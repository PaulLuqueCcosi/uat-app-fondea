'use client';

import { useState, useCallback, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import type { ActiveLoansKpi } from '@/modules/admin/admin-kpis.service';

/**
 * KPI #1 — Préstamos activos. GET /api/v1/admin/dashboard-kpis/active-loans
 *
 * count = COUNT(créditos con credit_type=STANDARD y status IN (ACTIVE, OVERDUE)).
 * total_principal = SUM(principal) de esos mismos créditos.
 * Créditos de NEGOCIACIÓN se excluyen a propósito — no son capital nuevo
 * desembolsado, son deuda ya existente reempaquetada (ver
 * NegotiationCreditCreationService del backend).
 *
 * TODO: Agregar gráfico de línea cuando haya datos históricos por día (no existe
 * endpoint de historial para este KPI todavía).
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
