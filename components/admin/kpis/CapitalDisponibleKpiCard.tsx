'use client';

import { Card, CardContent } from '@/components/ui/card';
import { KpiCard } from './KpiWrapper';
import type { CapitalKpi } from '@/modules/admin/admin-kpis.service';

/**
 * KPI 2: Capital disponible para prestar — Número S/ con semáforo.
 * Semáforo: verde si >30% libre, amarillo 15-30%, rojo <15%.
 */
export function CapitalDisponibleKpiCard() {
  return (
    <KpiCard<CapitalKpi>
      endpoint="/capital"
      errorLabel="Capital disponible"
      render={(data) => {
        const availablePercent = data.total_capital > 0
          ? (data.available / data.total_capital) * 100
          : 0;

        // Semáforo
        let semaphoreColor = 'bg-emerald-500'; // verde
        let textColor = 'text-emerald-600';
        if (availablePercent < 15) {
          semaphoreColor = 'bg-red-500';
          textColor = 'text-red-600';
        } else if (availablePercent < 30) {
          semaphoreColor = 'bg-amber-500';
          textColor = 'text-amber-600';
        }

        return (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-3 h-3 rounded-full ${semaphoreColor}`} />
                <p className="text-xs text-muted-foreground">Capital disponible</p>
              </div>
              <p className={`text-3xl font-bold ${textColor}`}>
                S/ {data.available.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                S/ {data.total_capital.toLocaleString()} - S/ {data.deployed.toLocaleString()} colocados
              </p>
            </CardContent>
          </Card>
        );
      }}
    />
  );
}
