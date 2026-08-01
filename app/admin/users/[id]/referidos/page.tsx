import { mockUserDetail } from '@/modules/admin';
import { UserReferralsTab } from '@/components/admin/users/UserReferralsTab';

// TODO: mockUserDetail.referrals + referidos hardcodeados — fuera de alcance de este push (ver plan).
export default async function AdminUserReferidosPage() {
  return (
    <UserReferralsTab
      code={mockUserDetail.referrals.code}
      totalReferred={mockUserDetail.referrals.totalReferred}
      pointsEarned={mockUserDetail.referrals.pointsEarned}
      referrals={[
        { id: 'ref_001', referredUserId: 'usr_006', registeredAt: '2026-06-10T08:00:00Z', completedAt: '2026-06-25T10:00:00Z', status: 'LOAN_COMPLETED', pointsAwarded: 15 },
        { id: 'ref_002', referredUserId: 'usr_007', registeredAt: '2026-06-18T14:00:00Z', completedAt: null, status: 'ACTIVE', pointsAwarded: 0 },
        { id: 'ref_003', referredUserId: 'usr_008', registeredAt: '2026-06-28T09:00:00Z', completedAt: null, status: 'REGISTERED', pointsAwarded: 0 },
      ]}
    />
  );
}
