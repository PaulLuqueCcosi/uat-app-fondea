'use client';

import { useState, useEffect } from 'react';
import { PortfolioHeader } from './PortfolioHeader';
import { PortfolioKpiCards } from './PortfolioKpiCards';
import { DistributionByTermChart } from './DistributionByTermChart';
import { DistributionByAmountChart } from './DistributionByAmountChart';
import { CohortRetentionTable } from './CohortRetentionTable';
import { UpcomingDueList } from './UpcomingDueList';
import { AmountBucketsConfig, type AmountBucketConfig } from './AmountBucketsConfig';
import {
  getAmountBucketsConfigAction,
  saveAmountBucketsConfigAction,
} from '@/app/actions/configuracion-generica.actions';
import { formatRangesParam } from './utils';
import type { PortfolioAnalyticsData } from './types';

const INITIAL_DATA: PortfolioAnalyticsData = {
  distributionByTerm: null,
  distributionByAmount: null,
  averageTicket: null,
  rotation: null,
  cohorts: null,
  upcomingDue: null,
};

export function PortfolioAnalyticsClient() {
  const [data, setData] = useState<PortfolioAnalyticsData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [amountBuckets, setAmountBuckets] = useState<AmountBucketConfig[]>([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const buckets = await getAmountBucketsConfigAction();
        const rangesParam = formatRangesParam(buckets);
        if (mounted) {
          setAmountBuckets(buckets);
        }

        const [termRes, amountRes, ticketRes, rotRes, cohortRes, dueRes] = await Promise.all([
          fetch('/api/admin/kpis/portfolio/analytics/distribution-by-term'),
          fetch(`/api/admin/kpis/portfolio/analytics/distribution-by-amount?ranges=${encodeURIComponent(rangesParam)}`),
          fetch('/api/admin/kpis/portfolio/analytics/average-ticket'),
          fetch('/api/admin/kpis/portfolio/analytics/rotation'),
          fetch('/api/admin/kpis/portfolio/analytics/cohort-retention'),
          fetch('/api/admin/kpis/portfolio/analytics/upcoming-due?days=7'),
        ]);

        const next: PortfolioAnalyticsData = { ...INITIAL_DATA };
        if (termRes.ok) next.distributionByTerm = await termRes.json();
        if (amountRes.ok) next.distributionByAmount = await amountRes.json();
        if (ticketRes.ok) next.averageTicket = await ticketRes.json();
        if (rotRes.ok) next.rotation = await rotRes.json();
        if (cohortRes.ok) next.cohorts = await cohortRes.json();
        if (dueRes.ok) next.upcomingDue = await dueRes.json();

        if (mounted) {
          setData(next);
        }
      } catch (e) {
        console.error('[PORTFOLIO_ANALYTICS]', e);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const refresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleSaveBuckets = async (buckets: AmountBucketConfig[]) => {
    setSavingConfig(true);
    try {
      await saveAmountBucketsConfigAction(buckets);
      refresh();
    } catch (e) {
      console.error('[PORTFOLIO_ANALYTICS_CONFIG]', e);
    } finally {
      setSavingConfig(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PortfolioHeader />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <PortfolioHeader />

      <PortfolioKpiCards
        averageTicket={data.averageTicket}
        rotation={data.rotation}
        distributionByTerm={data.distributionByTerm}
        upcomingDue={data.upcomingDue}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistributionByTermChart data={data.distributionByTerm} />
        <DistributionByAmountChart 
          data={data.distributionByAmount}
          configButton={
            <AmountBucketsConfig
              buckets={amountBuckets}
              onSave={handleSaveBuckets}
              disabled={savingConfig}
            />
          }
        />
      </div>

      <CohortRetentionTable data={data.cohorts} />
      <UpcomingDueList data={data.upcomingDue} />
    </div>
  );
}
