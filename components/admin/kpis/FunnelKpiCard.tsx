'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RotateCcw, Loader2 } from 'lucide-react';

interface FunnelKpi {
  applications_submitted: number;
  applications_pre_approved: number;
  credits_disbursed: number;
  overall_conversion_rate: number;
}

/**
 * KPI R9: Funnel de conversión simplificado.
 * Enviadas → Pre-aprobadas → Desembolsadas
 * Con selector de días.
 */
export function FunnelKpiCard({ days: initialDays = 30 }: { days?: number }) {
  const [days, setDays] = useState(initialDays);
  const [data, setData] = useState<FunnelKpi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async (selectedDays: number) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/kpis/funnel?days=${selectedDays}`);
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
    return <div className="h-52 bg-muted animate-pulse rounded-lg" />;
  }

  if (error && !data) {
    return (
      <div className="h-52 rounded-lg border border-dashed flex flex-col items-center justify-center gap-2">
        <p className="text-xs text-red-500">Error al cargar funnel</p>
        <Button variant="ghost" size="sm" onClick={() => fetchData(days)} className="h-6 text-[10px]">
          <RotateCcw className="h-3 w-3 mr-1" /> Reintentar
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const steps = [
    { label: 'Enviadas', value: data.applications_submitted, description: 'Pasaron KYC y formularios' },
    { label: 'Pre-aprobadas', value: data.applications_pre_approved, description: 'Evaluación crediticia OK' },
    { label: 'Desembolsadas', value: data.credits_disbursed, description: 'Crédito creado, dinero enviado' },
  ];
  const maxVal = Math.max(...steps.map(s => s.value), 1);
  const colors = ['#00A1CD', '#0087AD', '#10b981'];

  return (
    <div className="relative group">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Funnel de Conversión</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Conversión: <span className="font-bold text-foreground">{data.overall_conversion_rate}%</span>
              </span>
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
          </div>
        </CardHeader>
        <CardContent>
          {/* Barras horizontales tipo funnel */}
          <div className="space-y-3">
            {steps.map((step, i) => {
              const width = Math.max((step.value / maxVal) * 100, 8);
              return (
                <div key={step.label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{step.label}</span>
                    <span className="text-sm font-bold">{step.value}</span>
                  </div>
                  <div className="h-6 bg-muted rounded-md overflow-hidden">
                    <div
                      className="h-full rounded-md flex items-center px-2 transition-all"
                      style={{ width: `${width}%`, backgroundColor: colors[i] }}
                    >
                      {width > 30 && (
                        <span className="text-[10px] text-white font-medium truncate">
                          {step.description}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tasas de paso */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs text-muted-foreground">
            <span>
              Pre-aprobación: {data.applications_submitted > 0
                ? Math.round(data.applications_pre_approved * 100 / data.applications_submitted)
                : 0}%
            </span>
            <span>
              Desembolso: {data.applications_pre_approved > 0
                ? Math.round(data.credits_disbursed * 100 / data.applications_pre_approved)
                : 0}%
            </span>
          </div>
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
