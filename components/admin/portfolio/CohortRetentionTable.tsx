'use client';

import { useState, useCallback, useEffect } from 'react';
import { Users } from 'lucide-react';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import type { Cohorts, Cohort } from './types';

export function CohortRetentionTable() {
  const [data, setData] = useState<Cohorts | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/kpis/portfolio/analytics/cohort-retention');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) return <MetricCardSkeleton className="h-64" />;
  if (!data?.cohorts?.length) return null;

  return (
    <MetricCard
      icon={Users}
      title="Retención por Cohortes"
      description={`${data.cohorts.length} cohortes registradas`}
      onRefresh={fetchData}
      isRefreshing={loading && !!data}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Mes</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Clientes</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">30d</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">60d</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">90d</th>
            </tr>
          </thead>
          <tbody>
            {data.cohorts.map((c: Cohort) => (
              <tr key={c.month} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2 font-medium">{c.month}</td>
                <td className="px-3 py-2 text-right font-mono">{c.total_clients}</td>
                <td className="px-3 py-2 text-right font-mono">
                  {c.retention_30d != null ? `${c.retention_30d}%` : '—'}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {c.retention_60d != null ? `${c.retention_60d}%` : '—'}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {c.retention_90d != null ? `${c.retention_90d}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MetricCard>
  );
}
