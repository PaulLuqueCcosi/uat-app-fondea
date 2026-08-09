import { getNpsUserSurveys } from '@/modules/admin/admin-nps.service';
import { UserNpsTab } from '@/components/admin/users/UserNpsTab';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; size?: string }>;
}

export default async function AdminUserNpsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const pageSize = Number(sp.size) || 10;

  const result = await getNpsUserSurveys(id, page, pageSize, 1, 10);

  return <UserNpsTab userId={id} surveys={result.data} pagination={result.pagination} />;
}
