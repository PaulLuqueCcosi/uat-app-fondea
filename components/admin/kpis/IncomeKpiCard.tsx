'use client';

import { Card, CardContent } from '@/components/ui/card';
import { KpiCard } from './KpiWrapper';
import type { IncomeKpi } from '@/modules/admin/admin-kpis.service';

export function IncomeKpiCard({ days = 30 }: { days?: number }) {
  return (
    <KpiCard<IncomeKpi>
      endpoint="/income"
      params={`?days=${days}`}
      errorLabel="Ingresos"
      render={(data) => (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Ingresos hoy</p>
            <p className="text-3xl font-bold text-emerald-600">S/ {data.income_today.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Acumulado ({data.days_period}d): <span className="font-medium text-foreground">S/ {data.accumulated_income.toLocaleString()}</span>
            </p>
          </CardContent>
        </Card>
      )}
    />
  );
}
