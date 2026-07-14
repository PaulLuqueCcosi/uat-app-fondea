import { notFound } from 'next/navigation';
import { getApplicationDetail } from '@/modules/admin/admin-application-detail.service';
import { ApplicationDetailClient } from '@/components/admin/applications/ApplicationDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminApplicationDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getApplicationDetail(id);

  if (!data) {
    notFound();
  }

  return <ApplicationDetailClient data={data} />;
}
