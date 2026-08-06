import { getUserReferralOverview } from '@/modules/admin';
import { UserReferralsTab } from '@/components/admin/users/UserReferralsTab';
import { formatDate } from '@/components/admin/users/score-format';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminUserReferidosPage({ params }: Props) {
  const { id } = await params;
  const overview = await getUserReferralOverview(id);

  if (!overview) {
    return <p className="text-sm text-muted-foreground">No se pudo cargar la información de referidos.</p>;
  }

  const referredBy = overview.referredBy
    ? {
        ...overview.referredBy,
        appliedAtDisplay: formatDate(overview.referredBy.appliedAt),
      }
    : null;

  const referrals = overview.referrals.map((r) => ({
    ...r,
    referredRegisteredAtDisplay: r.referredRegisteredAt ? formatDate(r.referredRegisteredAt) : null,
    createdAtDisplay: formatDate(r.createdAt),
    completedAtDisplay: r.completedAt ? formatDate(r.completedAt) : null,
  }));

  return (
    <UserReferralsTab
      code={overview.code}
      totalReferred={overview.totalReferred}
      totalCompleted={overview.totalCompleted}
      referredBy={referredBy}
      referrals={referrals}
    />
  );
}
