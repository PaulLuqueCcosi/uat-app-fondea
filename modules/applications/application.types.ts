/**
 * Tipos del dominio Solicitudes (Applications).
 *
 * Define los estados, registros y tipos de fallo del pipeline.
 */

// ── Estados ───────────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'PRE_APPROVED'
  | 'PENDING_DOCUMENTS'
  | 'PENDING_SIGNATURE'
  | 'APPROVED'
  | 'REJECTED_BY_USER'
  | 'REJECTED'
  | 'FAILED'
  | 'BLOCKED'
  | 'EXPIRED';

export type ApplicationFailureCode =
  | 'BUSINESS_VALIDATION_FAILED'
  | 'SCORE_CALCULATION_FAILED'
  | 'EVALUATION_ERROR';

// ── Registro de solicitud ─────────────────────────────────────────────────────

export interface ApplicationRecord {
  id: string;
  status: ApplicationStatus;
  submittedAt?: string;
  evaluatedAt?: string;
  creditScore?: number;
  rejectionReason?: string;
  canRetryAt?: string;
  failureCode?: ApplicationFailureCode;
}

// ── Helpers de UI ─────────────────────────────────────────────────────────────

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  SUBMITTED: 'Enviada',
  PROCESSING: 'En evaluación',
  PRE_APPROVED: 'Pre-aprobada',
  PENDING_DOCUMENTS: 'Pendiente de docs',
  PENDING_SIGNATURE: 'Pendiente de firma',
  APPROVED: 'Aprobada',
  REJECTED_BY_USER: 'Rechazada por usuario',
  REJECTED: 'Rechazada',
  FAILED: 'Fallida',
  BLOCKED: 'Bloqueada',
  EXPIRED: 'Expirada',
};

export type StatusVariant = 'success' | 'warning' | 'error' | 'pending';

export const applicationStatusVariants: Record<ApplicationStatus, StatusVariant> = {
  APPROVED: 'success',
  PRE_APPROVED: 'success',
  SUBMITTED: 'warning',
  PROCESSING: 'warning',
  PENDING_DOCUMENTS: 'warning',
  PENDING_SIGNATURE: 'warning',
  REJECTED: 'error',
  REJECTED_BY_USER: 'error',
  FAILED: 'error',
  BLOCKED: 'error',
  EXPIRED: 'error',
};
