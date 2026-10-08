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
  | 'EXPIRED'
  | 'COMPLETED';

export type ApplicationFailureCode =
  | 'BUSINESS_VALIDATION_FAILED'
  | 'SCORE_CALCULATION_FAILED'
  | 'CALCULATION_ERROR'
  | 'EVALUATION_ERROR'
  /** No hay fondo para el monto pedido: rechazo del lado de Fondea, no del perfil del usuario. */
  | 'INSUFFICIENT_FUNDS';

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
  COMPLETED: 'Completada',
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
  COMPLETED: 'success',
};

/**
 * Un rechazo por falta de fondos no es un rechazo del perfil del cliente:
 * puede volver a intentarlo de inmediato, así que no se muestra como "Rechazada".
 */
export function isNoFundsRejection(
  app: Pick<ApplicationRecord, 'status' | 'failureCode'>,
): boolean {
  return app.status === 'REJECTED' && app.failureCode === 'INSUFFICIENT_FUNDS';
}

export const NO_FUNDS_LABEL = 'Sin fondos por ahora';

/** Etiqueta y variante a mostrar al cliente para el estado de una solicitud. */
export function getApplicationStatusDisplay(
  status: ApplicationStatus,
  failureCode?: ApplicationFailureCode,
): { label: string; variant: StatusVariant } {
  if (isNoFundsRejection({ status, failureCode })) {
    return { label: NO_FUNDS_LABEL, variant: 'warning' };
  }
  return { label: applicationStatusLabels[status], variant: applicationStatusVariants[status] };
}
