import { mockApplications } from '@/modules/admin';
import { UserApplicationsTab } from '@/components/admin/users/UserApplicationsTab';

// TODO: mockApplications — fuera de alcance de este push (ver plan).
export default async function AdminUserSolicitudesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UserApplicationsTab applications={mockApplications.filter((a) => a.userId === id)} />;
}
