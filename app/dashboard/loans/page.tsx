import { Suspense } from 'react';
import { LoansListServer } from '@/components/dashboard/LoansListServer';
import { LoansListSkeleton } from '@/components/dashboard/skeletons/LoansListSkeleton';
import { PageHeader } from '@/components/ui/page-header';
import { PageTitle } from '@/components/ui/page-title';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function LoansPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Mis Solicitudes' },
        ]}
      />

      <div className="flex flex-1 flex-col gap-4 p-4 max-w-5xl">
        <PageTitle
          title="Mis Solicitudes"
          description="Revisa el estado de todas tus solicitudes de préstamo. Filtra por estado para encontrarlas rápidamente."
        />

        <Suspense fallback={<LoansListSkeleton />}>
          <LoansListServer />
        </Suspense>
      </div>
    </>
  );
}
