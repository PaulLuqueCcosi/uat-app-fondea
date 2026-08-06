import { getAdminApplications } from '@/modules/admin/admin-applications.service';
import { UserApplicationsTab } from '@/components/admin/users/UserApplicationsTab';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; size?: string }>;
}

export default async function AdminUserSolicitudesPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const pageSize = Number(sp.size) || 10;

  const { data, pagination } = await getAdminApplications(page, pageSize, { userId: id });

  return <UserApplicationsTab userId={id} applications={data} pagination={pagination} />;
}
