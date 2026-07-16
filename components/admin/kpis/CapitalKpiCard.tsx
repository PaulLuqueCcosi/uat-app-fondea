'use client';

import { Card, CardContent } from '@/components/ui/card';
import { KpiCard } from './KpiWrapper';
import type { CapitalKpi } from '@/modules/admin/admin-kpis.service';

export function CapitalKpiCard() {
  return (
    <KpiCard<CapitalKpi>
      endpoint="/capital"
      errorLabel="Capital"
      render={(data) => (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Capital disponible</p>
            <p className="text-3xl font-bold">S/ {data.available.toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(data.utilization_rate, 100)}%` }} />
              </div>
              <span className="text-xs font-medium">{data.utilization_rate}%</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              S/ {data.deployed.toLocaleString()} colocados de S/ {data.total_capital.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}
    />
  );
}
