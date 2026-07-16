'use client';

import { Card, CardContent } from '@/components/ui/card';
import { KpiCard } from './KpiWrapper';
import type { NpsKpi } from '@/modules/admin/admin-kpis.service';

export function NpsKpiCard({ days = 30 }: { days?: number }) {
  return (
    <KpiCard<NpsKpi>
      endpoint="/nps"
      params={`?days=${days}`}
      errorLabel="NPS"
      render={(data) => (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">NPS del mes</p>
            <p className="text-3xl font-bold">{data.nps_score}</p>
            <div className="flex gap-3 mt-2 text-xs">
              <span className="text-emerald-600">P: {data.promoters}</span>
              <span className="text-gray-500">N: {data.passives}</span>
              <span className="text-red-600">D: {data.detractors}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{data.total_responses} respuestas</p>
          </CardContent>
        </Card>
      )}
    />
  );
}
