import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { FunnelLaborProfile } from '@/app/components/funnel/FunnelLaborProfile';
import { FunnelEconomicProfile } from '@/app/components/funnel/FunnelEconomicProfile';
import { FunnelReferences } from '@/app/components/funnel/FunnelReferences';
import { FunnelAdditionalInfo } from '@/app/components/funnel/FunnelAdditionalInfo';

const validSections = ['kyc', 'labor', 'economic', 'references', 'additional'];

export default async function DashboardSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (!validSections.includes(section)) {
    notFound();
  }

  const sectionMap: Record<string, React.ReactNode> = {
    kyc: (
      <Card>
        <p className="text-sm text-fondea-text">KYC - Por implementar</p>
      </Card>
    ),
    labor: <FunnelLaborProfile dashboardMode />,
    economic: <FunnelEconomicProfile dashboardMode />,
    references: <FunnelReferences dashboardMode />,
    additional: <FunnelAdditionalInfo dashboardMode />,
  };

  return <div className="max-w-3xl mx-auto">{sectionMap[section]}</div>;
}
