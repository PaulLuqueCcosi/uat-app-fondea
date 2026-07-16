'use client';

import { Card, CardContent } from '@/components/ui/card';
import { KpiCard } from './KpiWrapper';
import type { ActiveLoansKpi } from '@/modules/admin/admin-kpis.service';

export function ActiveLoansKpiCard() {
  return (
    <KpiCard<ActiveLoansKpi>
      endpoint="/active-loans"
      errorLabel="Préstamos activos"
      render={(data) => (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Préstamos activos</p>
            <p className="text-3xl font-bold">{data.count}</p>
            <p className="text-sm text-muted-foreground mt-1">S/ {data.total_principal.toLocaleString()} colocados</p>
          </CardContent>
        </Card>
      )}
    />
  );
}
