import type { Referral, ReferralSummary } from './types';

export const mockReferralSummary: ReferralSummary = {
  code: 'MARIO2026',
  link: 'https://fondea.pe/r/MARIO2026',
  totalReferrals: 2,
  completedReferrals: 2,
  totalPointsEarned: 30,
  pointsPerReferral: 15,
};

export const mockReferrals: Referral[] = [
  {
    id: 'ref-001',
    name: 'Carlos M.',
    registeredAt: '2026-04-10',
    status: 'COMPLETED',
    pointsEarned: 15,
  },
  {
    id: 'ref-002',
    name: 'Ana L.',
    registeredAt: '2026-05-20',
    status: 'COMPLETED',
    pointsEarned: 15,
  },
];
