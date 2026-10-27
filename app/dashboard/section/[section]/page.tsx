import { notFound, redirect } from 'next/navigation';

const validSections = ['kyc', 'labor', 'economic', 'references', 'additional'];

// Secciones que tienen su propia página dedicada
const dedicatedPages: Record<string, string> = {
  kyc: '/dashboard/section/kyc-validation',
  labor: '/dashboard/section/labor',
  economic: '/dashboard/section/economic',
  // Referencias e información adicional se editan en Mi expediente
  references: '/dashboard/mi-expediente',
  additional: '/dashboard/mi-expediente',
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

  redirect(dedicatedPages[section]);
}
