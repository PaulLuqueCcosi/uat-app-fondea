import { notFound, redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';

const validSections = ['kyc', 'labor', 'economic', 'references', 'additional'];

// Secciones que tienen su propia página dedicada
const dedicatedPages: Record<string, string> = {
  kyc: '/dashboard/section/kyc-validation',
};

export default async function DashboardSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (!validSections.includes(section)) {
    notFound();
  }

  // Si tiene página dedicada, redirigir
  if (dedicatedPages[section]) {
    redirect(dedicatedPages[section]);
  }

  const sectionMap: Record<string, React.ReactNode> = {
    labor: <Card><p className="text-sm text-fondea-text p-4">Labor Profile - Por implementar</p></Card>,
    economic: <Card><p className="text-sm text-fondea-text p-4">Economic Profile - Por implementar</p></Card>,
    references: <Card><p className="text-sm text-fondea-text p-4">References - Por implementar</p></Card>,
    additional: <Card><p className="text-sm text-fondea-text p-4">Additional Info - Por implementar</p></Card>,
  };

  return <div className="max-w-3xl mx-auto">{sectionMap[section]}</div>;
}
