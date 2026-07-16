'use client';

import { Card, CardContent } from '@/components/ui/card';
import { KpiCard } from './KpiWrapper';
import type { RepurchaseRateKpi } from '@/modules/admin/admin-kpis.service';

export function RepurchaseRateKpiCard({ days = 30 }: { days?: number }) {
  return (
    <KpiCard<RepurchaseRateKpi>
      endpoint="/repurchase-rate"
      params={`?days=${days}`}
      errorLabel="Recompra"
      render={(data) => (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Tasa de recompra</p>
            <p className="text-3xl font-bold">{data.rate}%</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {data.repeat_clients} de {data.active_clients} clientes repitieron
            </p>
          </CardContent>
        </Card>
      )}
    />
  );
}
