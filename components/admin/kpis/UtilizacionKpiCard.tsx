'use client';

import { Card, CardContent } from '@/components/ui/card';
import { KpiCard } from './KpiWrapper';
import type { CapitalKpi } from '@/modules/admin/admin-kpis.service';

/**
 * KPI 3: Tasa de utilización de cartera — Gauge circular 0-100%.
 * Si es muy bajo la cartera no rota bien.
 */
export function UtilizacionKpiCard() {
  return (
    <KpiCard<CapitalKpi>
      endpoint="/capital"
      errorLabel="Utilización"
      render={(data) => {
        const rate = data.utilization_rate;
        // Color del gauge según nivel
        const gaugeColor = rate >= 70 ? 'text-emerald-500' : rate >= 40 ? 'text-amber-500' : 'text-red-500';
        // Circumference = 2 * PI * radius (26) = 163.36
        const circumference = 163.36;
        const dashLength = (rate / 100) * circumference;

        return (
          <Card>
            <CardContent className="p-4 flex flex-col items-center">
              <p className="text-xs text-muted-foreground mb-3">Tasa de utilización</p>
              {/* Gauge circular */}
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32" cy="32" r="26"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    className="text-muted"
                  />
                  <circle
                    cx="32" cy="32" r="26"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${dashLength} ${circumference}`}
                    className={gaugeColor}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold">{rate}%</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                S/ {data.deployed.toLocaleString()} / S/ {data.total_capital.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        );
      }}
    />
  );
}
