import { getApplicationsAction } from '@/app/actions/application.actions';
import { DashboardHomeClient } from '@/components/dashboard/DashboardHomeClient';
import { getUser } from '@/app/actions/auth.actions';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  // El layout raíz ya garantiza que hay sesión activa.
  // Aquí solo obtenemos los datos del usuario.
  const user = await getUser();
  const applicationsData = await getApplicationsAction();

  return (
    <DashboardHomeClient
      userName={user?.name || 'Usuario'}
      applications={applicationsData?.applications ?? []}
    />
  );
}
