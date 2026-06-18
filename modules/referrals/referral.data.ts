import type { Referral, ReferralSummary } from './referral.types';

export const mockSummary: ReferralSummary = {
  code: 'MARIO2026',
  link: 'https://fondea.pe/r/MARIO2026',
  totalReferrals: 2,
  completedReferrals: 2,
  totalPointsEarned: 30,
  pointsPerReferral: 15,
};

export const mockReferrals: Referral[] = [
  { id: 'ref-001', referredUserId: 'user-carlos', registeredAt: '2026-04-10', completedAt: '2026-04-15', status: 'LOAN_COMPLETED', pointsAwarded: 15 },
  { id: 'ref-002', referredUserId: 'user-ana', registeredAt: '2026-05-22', completedAt: '2026-05-28', status: 'LOAN_COMPLETED', pointsAwarded: 15 },
];
