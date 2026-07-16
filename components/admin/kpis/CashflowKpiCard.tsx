'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RotateCcw, Loader2, LineChart } from 'lucide-react';
import Link from 'next/link';

interface CashflowKpi {
  accumulated: number;
  today: number;
  today_date: string;
  days_period: number;
}

/**
 * KPI R7: Ingresos por día (cashflow) — Todo lo que entró a caja.
 * Muestra acumulado del período + lo de hoy. Botón "Ver gráfico".
 */
export function CashflowKpiCard({ days: initialDays = 30 }: { days?: number }) {
  const [days, setDays] = useState(initialDays);
  const [data, setData] = useState<CashflowKpi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async (selectedDays: number) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/kpis/cashflow?days=${selectedDays}`);
      if (!res.ok) throw new Error(`${res.status}`);
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(days);
  }, [days, fetchData]);

  if (loading && !data) {
    return <div className="h-40 bg-muted animate-pulse rounded-lg" />;
  }

  if (error && !data) {
    return (
      <div className="h-40 rounded-lg border border-dashed flex flex-col items-center justify-center gap-2">
        <p className="text-xs text-red-500">Error al cargar ingresos a caja</p>
        <Button variant="ghost" size="sm" onClick={() => fetchData(days)} className="h-6 text-[10px]">
          <RotateCcw className="h-3 w-3 mr-1" /> Reintentar
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="relative group">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Ingresos a caja (total)</p>
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
          </div>
          <p className="text-3xl font-bold text-primary">
            S/ {data.accumulated.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            desde hace {data.days_period} días
          </p>
          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Hoy ({data.today_date})</p>
              <p className="text-sm font-bold">S/ {data.today.toLocaleString()}</p>
            </div>
            <Link href={`/admin/analytics/cashflow?days=${days}`}>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <LineChart className="h-3 w-3" /> Ver gráfico
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => fetchData(days)}
        disabled={loading}
        className="absolute top-2 right-12 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Refrescar"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
      </Button>
      {loading && data && <div className="absolute inset-0 bg-background/40 rounded-lg" />}
    </div>
  );
}
