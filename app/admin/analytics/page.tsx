'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDashboardKpis, type DashboardKpiResponse } from '@/modules/admin';
import { ActiveLoansCard } from '@/components/admin/dashboard/ActiveLoansCard';
import { CapitalGauge } from '@/components/admin/dashboard/CapitalGauge';
import { NplTramosChart } from '@/components/admin/dashboard/NplTramosChart';
import { NplByDaysChart } from '@/components/admin/dashboard/NplByDaysChart';
import { IncomeChart } from '@/components/admin/dashboard/IncomeChart';
import { IncomeTodayCard } from '@/components/admin/dashboard/IncomeTodayCard';
import { NpsCard } from '@/components/admin/dashboard/NpsCard';
import { FunnelMini } from '@/components/admin/dashboard/FunnelMini';
import { ActiveClientsCard } from '@/components/admin/dashboard/ActiveClientsCard';
import { RepurchaseRateCard } from '@/components/admin/dashboard/RepurchaseRateCard';
import dynamic from 'next/dynamic';
import { RotateCcw } from 'lucide-react';

const MapaPeru = dynamic(() => import('@/components/admin/dashboard/MapaPeru').then((m) => m.MapaPeru), {
  ssr: false,
});

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<DashboardKpiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (selectedDays: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboardKpis(selectedDays);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(days);
  }, [days, load]);

  if (loading && !data) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:p-6">
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => load(days)} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">KPIs Globales</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Resumen operativo — {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Período:</span>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 días</SelectItem>
              <SelectItem value="14">14 días</SelectItem>
              <SelectItem value="20">20 días</SelectItem>
              <SelectItem value="30">30 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
          <span>{error}</span>
          <Button size="sm" variant="ghost" onClick={() => load(days)}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Reintentar
          </Button>
        </div>
      )}

      {/* Fila 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ActiveLoansCard
          activeLoansCount={data.activeLoansCount}
          activeLoansPrincipal={data.activeLoansPrincipal}
        />
        <CapitalGauge
          portfolioUtilizationRate={data.portfolioUtilizationRate}
          capitalAvailable={data.capitalAvailable}
        />
        <NplByDaysChart />
        <NpsCard nps={data.nps} />
      </div>

      {/* Fila 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <NplTramosChart nplGeneralRate={data.nplGeneralRate} nplTramos={data.nplTramos} />
        </div>
        <IncomeTodayCard incomeToday={data.incomeToday} />
      </div>

      {/* Fila 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <IncomeChart
            grossIncomeLastDays={data.grossIncomeLastDays}
            days={days}
            onDaysChange={(d) => setDays(d)}
          />
        </div>
      </div>

      {/* Fila 4 */}
      <FunnelMini funnel={data.funnel} />

      {/* Fila 5 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ActiveClientsCard activeClientsCount={data.activeClientsCount} days={days} />
        <RepurchaseRateCard repurchaseRate={data.repurchaseRate} />
      </div>

      {/* Fila 6 */}
      <MapaPeru cityDistribution={data.cityDistribution} />
    </div>
  );
}
