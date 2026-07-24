'use client';

import { useState, useCallback, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';

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

  const fetchData = useCallback(async (selectedDays: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/kpis/funnel?days=${selectedDays}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(days);
  }, [days, fetchData]);

  if (loading && !data) return <MetricCardSkeleton className="h-52" />;
  if (!data) return null;

  const steps = [
    { label: 'Enviadas', value: data.applications_submitted, description: 'Pasaron KYC y formularios' },
    { label: 'Pre-aprobadas', value: data.applications_pre_approved, description: 'Evaluación crediticia OK' },
    { label: 'Desembolsadas', value: data.credits_disbursed, description: 'Crédito creado, dinero enviado' },
  ];
  const maxVal = Math.max(...steps.map(s => s.value), 1);
  const colors = ['#00A1CD', '#0087AD', '#10b981'];

  return (
    <MetricCard
      icon={Filter}
      title="Funnel de Conversión"
      description={`Conversión: ${data.overall_conversion_rate}%`}
      onRefresh={() => fetchData(days)}
      isRefreshing={loading && !!data}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-muted-foreground">
            <span className="mr-3">
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
      }
    >
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
    </MetricCard>
  );
}
