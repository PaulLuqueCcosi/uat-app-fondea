'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RotateCcw, Loader2, Repeat } from 'lucide-react';
import type { RepurchaseRateKpi } from '@/modules/admin/admin-kpis.service';

/**
 * KPI 11: Tasa de recompra — % de clientes que volvieron a pedir
 * dentro del período de haber pagado. Selector de días (7, 14, 20, 30).
 */
export function RepurchaseRateKpiCard({ days: initialDays = 30 }: { days?: number }) {
  const [days, setDays] = useState(initialDays);
  const [data, setData] = useState<RepurchaseRateKpi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async (selectedDays: number) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/kpis/repurchase-rate?days=${selectedDays}`);
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
    return <div className="h-32 bg-muted animate-pulse rounded-lg" />;
  }

  if (error && !data) {
    return (
      <div className="h-32 rounded-lg border border-dashed flex flex-col items-center justify-center gap-2">
        <p className="text-xs text-red-500">Error al cargar tasa de recompra</p>
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
            <div className="flex items-center gap-1.5">
              <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Tasa de recompra</p>
            </div>
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
          </div>
          <p className="text-3xl font-bold">{data.rate}%</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {data.repeat_clients} de {data.active_clients} clientes repitieron en los últimos {days} días
          </p>
        </CardContent>
      </Card>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => fetchData(days)}
        disabled={loading}
        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Refrescar"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
      </Button>
      {loading && data && <div className="absolute inset-0 bg-background/40 rounded-lg" />}
    </div>
  );
}
