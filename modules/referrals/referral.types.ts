/**
 * Tipos del módulo Referidos — alineados al backend real.
 */

export type ReferralStatus = 'REGISTERED' | 'LOAN_COMPLETED';

export interface Referral {
  id: string;
  referredUserId: string;
  status: ReferralStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface ReferralSummary {
  code: string;
  link: string;
  totalReferred: number;
  totalCompleted: number;
}

/** Información de quién me refirió */
export interface MyReferrer {
  referrerUserId: string;
  status: ReferralStatus;
  appliedAt: string;
}

export const referralStatusLabels: Record<ReferralStatus, string> = {
  REGISTERED: 'Registrado',
  LOAN_COMPLETED: 'Crédito completado',
};
