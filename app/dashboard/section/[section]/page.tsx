import { notFound, redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';

const validSections = ['kyc', 'labor', 'economic', 'references', 'additional'];

// Secciones que tienen su propia página dedicada
const dedicatedPages: Record<string, string> = {
  kyc: '/dashboard/section/kyc-validation',
  labor: '/dashboard/section/labor',
  economic: '/dashboard/section/economic',
};

const sectionTitles: Record<string, { title: string; description: string }> = {
  labor: { title: 'Perfil Laboral', description: 'Información sobre tu empleo actual' },
  economic: { title: 'Perfil Económico', description: 'Datos de ingresos y gastos' },
  references: { title: 'Referencias', description: 'Contactos de referencia personal' },
  additional: { title: 'Información Adicional', description: 'Datos complementarios' },
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

  const sectionInfo = sectionTitles[section];

  const sectionMap: Record<string, React.ReactNode> = {
    labor: <Card><p className="text-sm text-fondea-text p-4">Labor Profile - Por implementar</p></Card>,
    economic: <Card><p className="text-sm text-fondea-text p-4">Economic Profile - Por implementar</p></Card>,
    references: <Card><p className="text-sm text-fondea-text p-4">References - Por implementar</p></Card>,
    additional: <Card><p className="text-sm text-fondea-text p-4">Additional Info - Por implementar</p></Card>,
  };

  return (
    <PageContainer>
      <PageHeader
        title={sectionInfo.title}
        description={sectionInfo.description}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Expediente', href: '/dashboard/section/kyc-validation' },
          { label: sectionInfo.title }
        ]}
        showBackButton
      />

      {sectionMap[section]}
    </PageContainer>
  );
}
