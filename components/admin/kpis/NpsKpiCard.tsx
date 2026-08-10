'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Smile, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import type { NpsKpiWithTrend } from '@/modules/admin/admin-kpis.service';

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateMonthOptions(count: number = 6): { value: string; label: string; year: number; month: number }[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
    return {
      value: `${d.getFullYear()}-${d.getMonth() + 1}`,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      year: d.getFullYear(),
      month: d.getMonth() + 1,
    };
  });
}

// ── Component ───────────────────────────────────────────────────────────────

export function NpsKpiCard({ days = 30 }: { days?: number }) {
  const monthOptions = useMemo(() => generateMonthOptions(6), []);
  const [selected, setSelected] = useState(monthOptions[0].value);
  const [data, setData] = useState<NpsKpiWithTrend | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedOption = useMemo(
    () => monthOptions.find((o) => o.value === selected) ?? monthOptions[0],
    [selected, monthOptions],
  );

  const fetchData = useCallback(async (year: number, month: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/kpis/nps/monthly?year=${year}&month=${month}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedOption.year, selectedOption.month);
  }, [selectedOption, fetchData]);

  if (loading && !data) return <MetricCardSkeleton />;
  if (!data) return null;

  const npsScore = Math.round(data.nps_score);
  const trendDelta = data.trend_delta !== null ? Math.round(data.trend_delta) : null;

  const TrendIcon = trendDelta === null || trendDelta === 0 ? Minus : trendDelta > 0 ? TrendingUp : TrendingDown;
  const trendColor = trendDelta === null || trendDelta === 0
    ? 'text-muted-foreground'
    : trendDelta > 0
      ? 'text-emerald-600'
      : 'text-red-600';

  return (
    <MetricCard
      icon={Smile}
      title="NPS"
      description={data.month_label}
      onRefresh={() => fetchData(selectedOption.year, selectedOption.month)}
      isRefreshing={loading && !!data}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-600 font-medium">P: {data.promoters}</span>
            <span className="text-amber-600 font-medium">N: {data.passives}</span>
            <span className="text-red-600 font-medium">D: {data.detractors}</span>
          </div>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="flex items-baseline gap-3">
        <p className="text-4xl font-bold">{npsScore}</p>
        {trendDelta !== null && (
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
            <span className="text-sm font-medium">
              {trendDelta > 0 ? '+' : ''}{trendDelta}
            </span>
          </div>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">
        {data.total_responses} respuestas · % Promotores − % Detractores
      </p>
    </MetricCard>
  );
}
