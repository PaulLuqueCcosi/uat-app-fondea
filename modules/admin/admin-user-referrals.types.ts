/**
 * Tipos para el sistema de referidos de un usuario — vista admin.
 * Mapea la respuesta del backend de GET /api/v1/admin/users/{userId}/referrals
 * (AdminReferralOverviewResponse, serializado en snake_case).
 */

export type ReferralUseStatus = 'REGISTERED' | 'LOAN_COMPLETED';

export interface AdminReferrerInfoBackend {
  user_id: string;
  name: string | null;
  document_number: string | null;
  status: ReferralUseStatus;
  applied_at: string;
}

export interface AdminReferralUseInfoBackend {
  id: string;
  referred_user_id: string;
  referred_name: string | null;
  referred_document_number: string | null;
  /** Fecha real de creación de la cuenta del referido. */
  referred_registered_at: string | null;
  status: ReferralUseStatus;
  /** Fecha en que aplicó el código de referido. */
  created_at: string;
  /** Fecha en que completó su primer crédito (null si aún no). */
  completed_at: string | null;
}

export interface AdminReferralOverviewBackend {
  code: string;
  total_referred: number;
  total_completed: number;
  referred_by: AdminReferrerInfoBackend | null;
  referrals: AdminReferralUseInfoBackend[];
}

export interface AdminReferrerInfo {
  userId: string;
  name: string | null;
  documentNumber: string | null;
  status: ReferralUseStatus;
  appliedAt: string;
}

export interface AdminReferralUseInfo {
  id: string;
  referredUserId: string;
  referredName: string | null;
  referredDocumentNumber: string | null;
  referredRegisteredAt: string | null;
  status: ReferralUseStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface AdminReferralOverview {
  code: string;
  totalReferred: number;
  totalCompleted: number;
  referredBy: AdminReferrerInfo | null;
  referrals: AdminReferralUseInfo[];
}
