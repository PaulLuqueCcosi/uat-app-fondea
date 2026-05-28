import { getApplicationsAction } from '@/app/actions/application.actions';
import { DashboardHomeClient } from '@/components/dashboard/DashboardHomeClient';
import { PageHeader } from '@/components/ui/page-header';
import { getUser } from '@/app/actions/auth.actions';
import { getActiveIntencion } from '@/app/actions/intencion.actions';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const [user, applicationsData, activeIntencion] = await Promise.all([
    getUser(),
    getApplicationsAction(),
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
          applications={applicationsData?.applications ?? []}
          activeIntencion={activeIntencion}
        />
      </div>
    </>
  );
}
