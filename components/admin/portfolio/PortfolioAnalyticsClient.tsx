'use client';

import { PortfolioHeader } from './PortfolioHeader';
import { PortfolioKpiCards } from './PortfolioKpiCards';
import { DistributionByTermChart } from './DistributionByTermChart';
import { DistributionByAmountChart } from './DistributionByAmountChart';
import { CohortRetentionTable } from './CohortRetentionTable';
import { UpcomingDueList } from './UpcomingDueList';
import { AmountBucketsConfig } from './AmountBucketsConfig';

export function PortfolioAnalyticsClient() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <PortfolioHeader />

      <PortfolioKpiCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistributionByTermChart />
        <DistributionByAmountChart
          configButton={<AmountBucketsConfig />}
        />
      </div>

      <CohortRetentionTable />
      <UpcomingDueList />
    </div>
  );
}
