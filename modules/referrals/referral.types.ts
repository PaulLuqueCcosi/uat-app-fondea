/**
 * Tipos del módulo Referidos.
 */

export type ReferralStatus = 'REGISTERED' | 'ACTIVE' | 'LOAN_COMPLETED';

export interface Referral {
  id: string;
  referredUserId: string;
  registeredAt: string;
  completedAt: string | null;
  status: ReferralStatus;
  pointsAwarded: number;
}

export interface ReferralSummary {
  code: string;
  link: string;
  totalReferrals: number;
  completedReferrals: number;
  totalPointsEarned: number;
  pointsPerReferral: number;
}

export const referralStatusLabels: Record<ReferralStatus, string> = {
  REGISTERED: 'Registrado',
  ACTIVE: 'Activo',
  LOAN_COMPLETED: 'Completado',
};
