'use client';

import { useState, useCallback, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Repeat } from 'lucide-react';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import type { RepurchaseRateKpi } from '@/modules/admin/admin-kpis.service';

/**
 * KPI #11 — Tasa de recompra. GET /api/v1/admin/dashboard-kpis/repurchase-rate
 *
 * rate = repeat_clients / active_clients × 100.
 * active_clients = mismo cálculo que KPI #10 (ya con filtro STANDARD).
 * repeat_clients = clientes con un crédito ACTIVE (STANDARD) desembolsado en
 * [from, to] QUE TAMBIÉN tienen otro crédito PAID_OFF (STANDARD) cerrado en
 * esa misma ventana.
 *
 * ✅ Corregido (2026-08-18), 2 bugs: (1) el adapter llamaba a la query nativa
 * pasando `(from, from)` en vez de `(from, to)` — la query ni siquiera tenía
 * límite superior en las fechas, se reescribió con `BETWEEN :from AND :to` en
 * ambas condiciones; (2) ninguna subconsulta filtraba `credit_type='STANDARD'`.
 * Verificado a mano contra la BD real: 66.7% (2 de 3), coincide exacto con el
 * cálculo directo en SQL.
 */
export function RepurchaseRateKpiCard({ days: initialDays = 30 }: { days?: number }) {
  const [days, setDays] = useState(initialDays);
  const [data, setData] = useState<RepurchaseRateKpi | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (selectedDays: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/kpis/repurchase-rate?days=${selectedDays}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(days);
  }, [days, fetchData]);

  if (loading && !data) return <MetricCardSkeleton />;
  if (!data) return null;

  return (
    <MetricCard
      icon={Repeat}
      title="Tasa de recompra"
      metricKey="repurchaseRate"
      description={`${data.repeat_clients} de ${data.active_clients} clientes repitieron en los últimos ${days} días`}
      onRefresh={() => fetchData(days)}
      isRefreshing={loading && !!data}
      footer={
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="h-7 w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 días</SelectItem>
            <SelectItem value="14">14 días</SelectItem>
            <SelectItem value="20">20 días</SelectItem>
            <SelectItem value="30">30 días</SelectItem>
            <SelectItem value="60">60 días</SelectItem>
            <SelectItem value="90">90 días</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      <p className="text-3xl font-bold">{data.rate}%</p>
    </MetricCard>
  );
}
