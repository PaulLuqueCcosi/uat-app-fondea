/**
 * Tipos del módulo Referidos.
 */

export type ReferralStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED';

export interface Referral {
  id: string;
  name: string;
  registeredAt: string;
  status: ReferralStatus;
  pointsEarned: number;
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
  PENDING: 'Pendiente',
  ACTIVE: 'Activo',
  COMPLETED: 'Completado',
};
