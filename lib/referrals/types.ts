/**
 * Tipos para el módulo de Referidos.
 */

export type ReferralStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED';

export interface Referral {
  id: string;
  /** Nombre del amigo referido */
  name: string;
  /** Fecha en que se registró con el código */
  registeredAt: string;
  /** Estado del referido */
  status: ReferralStatus;
  /** Puntos ganados por este referido (0 si aún no completó) */
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
