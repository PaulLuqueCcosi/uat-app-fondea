'use client';

import { useState, useCallback, useEffect } from 'react';
import { Clock } from 'lucide-react';
import Link from 'next/link';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import type { UpcomingDue, UpcomingDueLoan } from './types';

export function UpcomingDueList() {
  const [data, setData] = useState<UpcomingDue | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/kpis/portfolio/analytics/upcoming-due?days=7');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) return <MetricCardSkeleton className="h-64" />;
  if (!data?.loans?.length) return null;

  return (
    <MetricCard
      icon={Clock}
      title="Préstamos próximos a vencer (7 días)"
      description={`${data.total_count} préstamos · S/ ${data.total_amount.toLocaleString()}`}
      onRefresh={fetchData}
      isRefreshing={loading && !!data}
      className="[&_.text-primary]:text-amber-500"
    >
      <div className="divide-y max-h-[400px] overflow-y-auto">
        {data.loans.map((loan: UpcomingDueLoan) => (
          <Link
            key={loan.credit_id}
            href={`/admin/credits/${loan.credit_id}`}
            className="flex items-center justify-between py-2.5 px-1 hover:bg-muted/30 rounded transition-colors"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{loan.client_name ?? 'Sin nombre'}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{loan.client_document}</span>
            </div>
            <div className="flex items-center gap-4 text-right">
              <span className="text-sm font-semibold">S/ {loan.principal}</span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${
                  loan.days_until_due <= 2
                    ? 'bg-red-50 text-red-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {loan.days_until_due === 0 ? 'Hoy' : `${loan.days_until_due}d`}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </MetricCard>
  );
}
