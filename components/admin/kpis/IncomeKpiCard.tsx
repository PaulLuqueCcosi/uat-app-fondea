'use client';

import { useState, useCallback, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DollarSign, LineChart } from 'lucide-react';
import Link from 'next/link';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import type { IncomeKpi } from '@/modules/admin/admin-kpis.service';

/**
 * KPI #6 — Ingresos brutos (SOLO intereses). GET /api/v1/admin/dashboard-kpis/income
 *
 * accumulated_income = SUM(cuotas pagadas en los últimos N días) × interestRatio.
 * income_today = igual pero solo lo cobrado HOY.
 * interestRatio = promedio de (totalDue - principal) / totalDue entre los créditos
 * activos — una ESTIMACIÓN de qué % de cada pago recibido es interés vs. capital
 * devuelto (no usa el desglose real por cuota `interest_amount`/`principal_amount`
 * que sí existe ahora en el dominio Installment — este KPI podría volverse exacto
 * sumando esos campos directo en vez de aplicar un ratio promedio, pero hoy no lo hace).
 *
 * Distinto de KPI #7 (Cashflow): acá se filtra la porción de interés; en #7 se
 * cuenta TODO lo que entró a caja (capital + interés), sin filtrar nada.
 */
export function IncomeKpiCard({ days: initialDays = 30 }: { days?: number }) {
  const [days, setDays] = useState(initialDays);
  const [data, setData] = useState<IncomeKpi | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (selectedDays: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/kpis/income?days=${selectedDays}`);
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
      icon={DollarSign}
      title="Ingresos brutos acumulados"
      metricKey="income"
      description={`desde hace ${data.days_period} días`}
      onRefresh={() => fetchData(days)}
      isRefreshing={loading && !!data}
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            <p className="text-xs text-muted-foreground">Ingresos hoy</p>
            <p className="text-sm font-bold">S/ {data.income_today.toLocaleString()}</p>
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
            <Link href={`/admin/analytics/income?days=${days}`}>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <LineChart className="h-3 w-3" /> Ver gráfico
              </Button>
            </Link>
          </div>
        </div>
      }
    >
      <p className="text-3xl font-bold text-emerald-600">
        S/ {data.accumulated_income.toLocaleString()}
      </p>
    </MetricCard>
  );
}
