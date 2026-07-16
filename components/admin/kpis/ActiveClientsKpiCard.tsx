'use client';

import { Card, CardContent } from '@/components/ui/card';
import { KpiCard } from './KpiWrapper';
import type { ActiveClientsKpi } from '@/modules/admin/admin-kpis.service';

export function ActiveClientsKpiCard({ days = 30 }: { days?: number }) {
  return (
    <KpiCard<ActiveClientsKpi>
      endpoint="/active-clients"
      params={`?days=${days}`}
      errorLabel="Clientes activos"
      render={(data) => (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Clientes activos ({data.days_period}d)</p>
            <p className="text-3xl font-bold">{data.count}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Con al menos 1 préstamo activo</p>
          </CardContent>
        </Card>
      )}
    />
  );
}
