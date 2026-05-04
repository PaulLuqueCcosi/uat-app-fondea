import { getApplicationsAction } from '@/app/actions/application.actions';
import { DashboardHomeClient } from '@/components/dashboard/DashboardHomeClient';
import { getUser } from '@/app/actions/auth.actions';
import { getActiveIntencion } from '@/app/actions/intencion.actions';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const user = await getUser();
  const applicationsData = await getApplicationsAction();
  const activeIntencion = await getActiveIntencion();

  return (
    <DashboardHomeClient
      userName={user?.name || 'Usuario'}
      applications={applicationsData?.applications ?? []}
      activeIntencion={activeIntencion}
    />
  );
}
