import { Megaphone } from 'lucide-react';
import { getAdminFunnelMetrics } from '@/modules/admin/admin-funnel.service';
import { getReferralSummary, getReferralList } from '@/modules/admin/admin-marketing.service';
import { FunnelTab } from '@/components/admin/funnel/FunnelTab';
import { MarketingAnalyticsTab } from '@/components/admin/marketing/MarketingAnalyticsTab';
import { ReferralsTab } from '@/components/admin/marketing/ReferralsTab';
import { MarketingTabs } from '@/components/admin/marketing/MarketingTabs';

interface Props {
  searchParams: Promise<{
    tab?: string;
    rpage?: string;
    rsize?: string;
  }>;
}

export default async function AdminMarketingPage({ searchParams }: Props) {
  const params = await searchParams;

  const rPage = Number(params.rpage) || 1;
  const rPageSize = Number(params.rsize) || 20;

  // R40 exige from/to obligatorios en el backend — ventana amplia por defecto
  // (365 días) para que el resumen del programa de referidos no salga vacío.
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [funnelMetrics, referralSummary, referralList] = await Promise.all([
    getAdminFunnelMetrics(),
    getReferralSummary(from, to),
    getReferralList(rPage, rPageSize, from, to),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Megaphone className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Marketing y Adquisición</h1>
          <p className="text-sm text-muted-foreground">
            Funnel de conversión, KYC, abandono, rechazos y referidos — M5
          </p>
        </div>
      </div>

      <MarketingTabs
        referralsCount={referralList.pagination.totalItems}
        funnelContent={<FunnelTab metrics={funnelMetrics} />}
        analyticsContent={<MarketingAnalyticsTab />}
        referralsContent={
          <ReferralsTab
            summary={referralSummary}
            data={referralList.data}
            pagination={referralList.pagination}
          />
        }
      />
    </div>
  );
}
