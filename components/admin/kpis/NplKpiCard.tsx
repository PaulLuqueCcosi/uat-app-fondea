'use client';

import { useState, useCallback, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import type { NplKpi } from '@/modules/admin/admin-kpis.service';

export function NplKpiCard() {
  const [data, setData] = useState<NplKpi | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/kpis/npl');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) return <MetricCardSkeleton className="col-span-full lg:col-span-2" />;
  if (!data) return null;

  return (
    <div className="col-span-full lg:col-span-2">
      <MetricCard
        icon={AlertTriangle}
        title="Tasa de Mora (NPL)"
        description={`S/ ${data.overdue_capital.toLocaleString()} / S/ ${data.active_capital.toLocaleString()}`}
        onRefresh={fetchData}
        isRefreshing={loading && !!data}
      >
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-3xl font-bold">{data.general_rate}%</span>
          <span className="text-sm text-muted-foreground">NPL general</span>
        </div>
        <div className="space-y-2">
          {data.tranches.map((t) => (
            <div key={t.label} className="flex items-center gap-3">
              <span className="text-xs w-16 text-muted-foreground">{t.label}</span>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    t.label.includes('1-30') ? 'bg-amber-400' :
                    t.label.includes('31-60') ? 'bg-orange-500' :
                    t.label.includes('61-90') ? 'bg-red-500' : 'bg-gray-500'
                  }`}
                  style={{ width: `${Math.min(t.rate * 5, 100)}%` }}
                />
              </div>
              <span className="text-xs font-mono w-12 text-right">{t.rate}%</span>
              <span className="text-xs text-muted-foreground w-10 text-right">{t.loan_count}</span>
            </div>
          ))}
        </div>
        {data.by_term_days.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">NPL por plazo</p>
            <div className="grid grid-cols-3 gap-2">
              {data.by_term_days.map((td) => (
                <div key={td.term_days} className="text-center p-2 rounded bg-muted/50">
                  <p className="text-lg font-bold">{td.npl_rate}%</p>
                  <p className="text-[10px] text-muted-foreground">{td.term_days}d ({td.overdue_loans}/{td.total_loans})</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </MetricCard>
    </div>
  );
}
