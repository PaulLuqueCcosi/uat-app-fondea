/**
 * Types para el módulo admin de Reclamaciones (M4 / R32).
 */

// ── Enums y labels ───────────────────────────────────────────────────────────

export type ComplaintType = 'RECLAMO' | 'QUEJA';
export type ComplaintStatus = 'REGISTRADO' | 'EN_REVISION' | 'RESPONDIDO';

export const COMPLAINT_TYPE_LABELS: Record<ComplaintType, string> = {
  RECLAMO: 'Reclamo',
  QUEJA: 'Queja',
};

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  REGISTRADO: 'Registrado',
  EN_REVISION: 'En revisión',
  RESPONDIDO: 'Respondido',
};

// ── Row para la tabla admin ──────────────────────────────────────────────────

export interface AdminComplaintRow {
  id: string;
  correlativeNumber: number;
  type: ComplaintType;
  status: ComplaintStatus;
  clientName: string;
  clientDocument: string;
  productServiceDetail: string;
  submittedDate: string;
  legalDeadline: string;
  businessDaysElapsed: number;
  businessDaysRemaining: number;
  isOverdue: boolean;
}

// ── Detalle de una reclamación ───────────────────────────────────────────────

/** Detalle completo — vista admin, GET /api/v1/admin/complaints/{id}. */
export interface AdminComplaintDetail {
  id: string;
  correlativeNumber: number;
  type: ComplaintType;
  status: ComplaintStatus;
  userId: string;
  /** Crédito relacionado, si el reclamo es sobre un préstamo específico. Null si es general. */
  relatedCreditId: string | null;
  // Snapshot del consumidor al momento del reclamo (Anexo I) — no es una referencia viva al perfil.
  consumerName: string;
  consumerDocument: string;
  consumerPhone: string | null;
  consumerEmail: string | null;
  productServiceDetail: string;
  amountInvolved: number | null;
  complaintDetail: string;
  /** Pedido concreto del consumidor — campo obligatorio del Anexo I. */
  consumerRequest: string;
  submittedDate: string;
  legalDeadline: string;
  businessDaysElapsed: number;
  businessDaysRemaining: number;
  isOverdue: boolean;
  responseText: string | null;
  respondedAt: string | null;
  respondedBy: string | null;
  /** Null mientras no tenga respuesta. */
  wasRespondedLate: boolean | null;
}

// ── Filtros ──────────────────────────────────────────────────────────────────

export interface ComplaintFilters {
  /** Uno o más estados — ej. PENDING_STATUSES para "pendientes / no respondido". */
  status?: ComplaintStatus | ComplaintStatus[];
  type?: ComplaintType;
  onlyOverdue?: boolean;
  /**
   * legalDeadline es equivalente a ordenar por días hábiles restantes — para
   * un mismo "hoy", más días de calendario hasta el deadline siempre implica
   * más (o igual) días hábiles restantes, nunca menos. asc = más urgentes primero.
   */
  sortBy?: 'submittedDate' | 'legalDeadline';
  sortDir?: 'asc' | 'desc';
}

/** Reclamos todavía no cerrados — usado por el filtro rápido "Pendientes". */
export const PENDING_STATUSES: ComplaintStatus[] = ['REGISTRADO', 'EN_REVISION'];

// ── Helpers de UI ────────────────────────────────────────────────────────────

export function getCountdownColor(remaining: number, isOverdue: boolean): {
  text: string;
  bg: string;
  border: string;
} {
  if (isOverdue || remaining < 0) {
    return { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
  }
  if (remaining <= 5) {
    return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
  }
  return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
}

export function getStatusStyle(status: ComplaintStatus): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'REGISTRADO':
      return { label: 'Registrado', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'EN_REVISION':
      return { label: 'En revisión', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'RESPONDIDO':
      return { label: 'Respondido', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
  }
}
