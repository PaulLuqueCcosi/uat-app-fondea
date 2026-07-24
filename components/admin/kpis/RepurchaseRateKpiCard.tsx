'use client';

import { useState, useCallback, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Repeat } from 'lucide-react';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import type { RepurchaseRateKpi } from '@/modules/admin/admin-kpis.service';

/**
 * KPI 11: Tasa de recompra — % de clientes que volvieron a pedir
 * dentro del período de haber pagado. Selector de días (7, 14, 20, 30).
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
