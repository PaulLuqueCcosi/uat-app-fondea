import { getUser } from '@/app/actions/auth.actions';
import { DashboardHomeClient } from '@/app/components/dashboard/DashboardHomeClient';

export default async function DashboardPage() {
  const user = await getUser();

  return <DashboardHomeClient userName={user?.name || 'Usuario'} />;
}
