/**
 * Types para reclamaciones — lado cliente.
 */

export type ComplaintType = 'RECLAMO' | 'QUEJA';
export type ComplaintStatus = 'REGISTRADO' | 'EN_REVISION' | 'RESPONDIDO';

export const COMPLAINT_TYPE_OPTIONS: { value: ComplaintType; label: string; description: string }[] = [
  {
    value: 'RECLAMO',
    label: 'Reclamo',
    description: 'Disconformidad con el producto o servicio (ej: cobro incorrecto, error en monto)',
  },
  {
    value: 'QUEJA',
    label: 'Queja',
    description: 'Malestar por la atención recibida (ej: demora, trato inadecuado)',
  },
];

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  REGISTRADO: 'Registrado',
  EN_REVISION: 'En revisión',
  RESPONDIDO: 'Respondido',
};

// ── Complaint del usuario ────────────────────────────────────────────────────

export interface MyComplaint {
  id: string;
  correlativeNumber: number;
  type: ComplaintType;
  status: ComplaintStatus;
  productServiceDetail: string;
  complaintDetail: string;
  consumerRequest: string;
  amountInvolved: number | null;
  submittedDate: string;
  legalDeadline: string;
  businessDaysElapsed: number;
  businessDaysRemaining: number;
  isOverdue: boolean;
  responseText: string | null;
  respondedAt: string | null;
}

// ── Request para registrar ───────────────────────────────────────────────────

export interface SubmitComplaintRequest {
  type: ComplaintType;
  relatedCreditId?: string;
  consumerPhone: string;
  consumerEmail: string;
  productServiceDetail: string;
  amountInvolved?: number;
  complaintDetail: string;
  consumerRequest: string;
}

// ── Paginación (Spring Page<T>) ─────────────────────────────────────────────

export interface Pagination {
  /** 1-based, como espera el componente DataTable. */
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// ── Resultado ────────────────────────────────────────────────────────────────

export interface ComplaintError {
  code: string;
  message: string;
}

export type ComplaintResult<T> = { ok: true; data: T } | { ok: false; error: ComplaintError };
