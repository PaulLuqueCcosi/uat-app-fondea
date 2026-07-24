'use client';

import { useState, useCallback, useEffect } from 'react';
import { Smile } from 'lucide-react';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import type { NpsKpi } from '@/modules/admin/admin-kpis.service';

export function NpsKpiCard({ days = 30 }: { days?: number }) {
  const [data, setData] = useState<NpsKpi | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/kpis/nps?days=${days}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) return <MetricCardSkeleton />;
  if (!data) return null;

  return (
    <MetricCard
      icon={Smile}
      title="NPS del mes"
      onRefresh={fetchData}
      isRefreshing={loading && !!data}
    >
      <p className="text-3xl font-bold">{data.nps_score}</p>
      <div className="flex gap-3 mt-2 text-xs">
        <span className="text-emerald-600">P: {data.promoters}</span>
        <span className="text-gray-500">N: {data.passives}</span>
        <span className="text-red-600">D: {data.detractors}</span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">{data.total_responses} respuestas</p>
    </MetricCard>
  );
}
