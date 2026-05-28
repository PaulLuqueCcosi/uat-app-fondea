import { Suspense } from 'react';
import { getApplicationsAction } from '@/app/actions/application.actions';
import { DashboardHomeClient } from '@/components/dashboard/DashboardHomeClient';
import { ExpedienteSectionServer } from '@/components/dashboard/sections/ExpedienteSectionServer';
import { ApplicationsSectionServer } from '@/components/dashboard/sections/ApplicationsSectionServer';
import { ExpedienteSkeleton } from '@/components/dashboard/skeletons/ExpedienteSkeleton';
import { ApplicationsSkeleton } from '@/components/dashboard/skeletons/ApplicationsSkeleton';
import { PageHeader } from '@/components/ui/page-header';
import { getUser } from '@/app/actions/auth.actions';
import { getActiveIntencion } from '@/app/actions/intencion.actions';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const [user, activeIntencion] = await Promise.all([
    getUser(),
    getActiveIntencion(),
  ]);

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard' },
        ]}
      />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <DashboardHomeClient
          userName={user?.name || 'Usuario'}
          activeIntencion={activeIntencion}
        >
          {/* Expediente con Suspense */}
          <Suspense fallback={<ExpedienteSkeleton />}>
            <ExpedienteSectionServer />
          </Suspense>

          {/* Solicitudes con Suspense */}
          <Suspense fallback={<ApplicationsSkeleton />}>
            <ApplicationsSectionServerWrapper />
          </Suspense>
        </DashboardHomeClient>
      </div>
    </>
  );
}

// Wrapper para obtener las aplicaciones y pasarlas al componente
async function ApplicationsSectionServerWrapper() {
  const applicationsData = await getApplicationsAction();
  return <ApplicationsSectionServer applications={applicationsData?.applications ?? []} />;
}
