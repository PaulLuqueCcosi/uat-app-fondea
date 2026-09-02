'use client';

import { useState, useCallback, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Coins, LineChart } from 'lucide-react';
import Link from 'next/link';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';

interface CashflowKpi {
  accumulated: number;
  today: number;
  today_date: string;
  days_period: number;
}

/**
 * KPI #7 — Entradas a caja (cashflow), capital + interés SIN filtrar.
 * GET /api/v1/admin/dashboard-kpis/cashflow
 *
 * accumulated = SUM(cuotas pagadas en los últimos N días) — TODO lo cobrado, capital
 * y comisiones/interés juntos (a diferencia de KPI #6, que solo cuenta la porción
 * de interés). Es el indicador de "salud diaria de caja": cuánta plata entró, sin
 * distinguir si es devolución de capital o ganancia real.
 * today = igual pero solo lo cobrado HOY (misma fecha del servidor).
 */
export function CashflowKpiCard({ days: initialDays = 30 }: { days?: number }) {
  const [days, setDays] = useState(initialDays);
  const [data, setData] = useState<CashflowKpi | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (selectedDays: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/kpis/cashflow?days=${selectedDays}`);
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
      icon={Coins}
      title="Ingresos a caja (total)"
      metricKey="cashflow"
      description={`desde hace ${data.days_period} días`}
      onRefresh={() => fetchData(days)}
      isRefreshing={loading && !!data}
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            <p className="text-xs text-muted-foreground">Hoy ({data.today_date})</p>
            <p className="text-sm font-bold">S/ {data.today.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="h-7 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 días</SelectItem>
                <SelectItem value="14">14 días</SelectItem>
                <SelectItem value="20">20 días</SelectItem>
                <SelectItem value="30">30 días</SelectItem>
              </SelectContent>
            </Select>
            <Link href={`/admin/analytics/cashflow?days=${days}`}>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <LineChart className="h-3 w-3" /> Ver gráfico
              </Button>
            </Link>
          </div>
        </div>
      }
    >
      <p className="text-3xl font-bold text-primary">
        S/ {data.accumulated.toLocaleString()}
      </p>
    </MetricCard>
  );
}
