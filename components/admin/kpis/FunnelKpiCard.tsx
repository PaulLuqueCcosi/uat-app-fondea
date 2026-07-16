'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from './KpiWrapper';
import type { FunnelKpi } from '@/modules/admin/admin-kpis.service';

export function FunnelKpiCard({ days = 30 }: { days?: number }) {
  return (
    <KpiCard<FunnelKpi>
      endpoint="/funnel"
      params={`?days=${days}`}
      errorLabel="Funnel"
      render={(data) => {
        const steps = [
          { label: 'Intenciones', value: data.anonymous_intentions },
          { label: 'Registros', value: data.user_intentions },
          { label: 'Solicitudes', value: data.applications_submitted },
          { label: 'Aprobadas', value: data.applications_approved },
          { label: 'Desembolsos', value: data.credits_disbursed },
        ];
        const maxVal = Math.max(...steps.map(s => s.value), 1);

        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Funnel de Conversión ({days}d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-1 h-28">
                {steps.map((step, i) => {
                  const height = Math.max((step.value / maxVal) * 100, 8);
                  return (
                    <div key={step.label} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-bold">{step.value}</span>
                      <div
                        className="w-full rounded-t"
                        style={{ height: `${height}%`, backgroundColor: `hsl(${200 - i * 30}, 70%, 50%)` }}
                      />
                      <span className="text-[9px] text-muted-foreground text-center leading-tight">{step.label}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Conversión: <span className="font-bold text-foreground">{data.overall_conversion_rate}%</span>
              </p>
            </CardContent>
          </Card>
        );
      }}
    />
  );
}
