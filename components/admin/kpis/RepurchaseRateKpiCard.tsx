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
 * active_clients = mismo cálculo que KPI #10 (ver nota ahí: sin filtro STANDARD).
 * repeat_clients = clientes con un crédito ACTIVE desembolsado desde hace N días
 * QUE TAMBIÉN tienen otro crédito PAID_OFF cerrado desde esa misma fecha.
 *
 * 🐛 Bug conocido, no corregido: `CreditReportingRepositoryAdapter.countRepeatClients`
 * llama a la query nativa pasando `(from, from)` en vez de `(from, to)` — el
 * parámetro `to` que en teoría acota el rango se ignora silenciosamente. Hoy no
 * se nota en la UI porque `to` siempre es "ahora" en este KPI, pero si algún día
 * se necesita calcular la tasa de recompra de un período pasado específico
 * (no "los últimos N días desde hoy"), el resultado va a salir mal sin ningún error visible.
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
