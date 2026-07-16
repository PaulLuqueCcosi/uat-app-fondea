'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from './KpiWrapper';
import type { CityDistributionKpi } from '@/modules/admin/admin-kpis.service';

export function CityDistributionKpiCard() {
  return (
    <KpiCard<CityDistributionKpi>
      endpoint="/city-distribution"
      errorLabel="Distribución por ciudad"
      render={(data) => (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribución por Ciudad</CardTitle>
          </CardHeader>
          <CardContent>
            {data.cities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>
            ) : (
              <div className="space-y-2">
                {data.cities.slice(0, 8).map((city) => (
                  <div key={city.city} className="flex items-center gap-3">
                    <span className="text-xs w-24 truncate" title={city.city}>{city.city}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/70 rounded-full" style={{ width: `${city.percentage}%` }} />
                    </div>
                    <span className="text-xs font-mono w-10 text-right">{city.percentage}%</span>
                    <span className="text-xs text-muted-foreground w-8 text-right">{city.loan_count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    />
  );
}
