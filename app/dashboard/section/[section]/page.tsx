import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';

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
    kyc: <Card><p className="text-sm text-fondea-text p-4">KYC - Por implementar</p></Card>,
    labor: <Card><p className="text-sm text-fondea-text p-4">Labor Profile - Por implementar</p></Card>,
    economic: <Card><p className="text-sm text-fondea-text p-4">Economic Profile - Por implementar</p></Card>,
    references: <Card><p className="text-sm text-fondea-text p-4">References - Por implementar</p></Card>,
    additional: <Card><p className="text-sm text-fondea-text p-4">Additional Info - Por implementar</p></Card>,
  };

  return <div className="max-w-3xl mx-auto">{sectionMap[section]}</div>;
}
