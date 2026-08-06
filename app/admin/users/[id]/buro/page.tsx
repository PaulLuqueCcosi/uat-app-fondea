import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getUserBuroReport, getUserBuroHistory } from '@/modules/admin';
import { BuroDetail } from '@/components/admin/users/BuroDetail';

export default async function AdminUserBuroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [report, history] = await Promise.all([
    getUserBuroReport(id),
    getUserBuroHistory(id),
  ]);

  return (
    <div className="space-y-4">
      <Link
        href={`/admin/users/${id}/score`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al score
      </Link>
      <BuroDetail userId={id} report={report} history={history} />
    </div>
  );
}
