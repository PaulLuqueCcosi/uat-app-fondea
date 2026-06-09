import { Suspense } from 'react';
import { LoansListServer } from '@/components/dashboard/LoansListServer';
import { LoansListSkeleton } from '@/components/dashboard/skeletons/LoansListSkeleton';
import { PageTitle } from '@/components/ui/page-title';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function LoansPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <PageTitle
        title="Mis Solicitudes"
        description="Revisa el estado de todas tus solicitudes de préstamo."
      />

      <Suspense fallback={<LoansListSkeleton />}>
        <LoansListServer />
      </Suspense>
    </div>
  );
}
