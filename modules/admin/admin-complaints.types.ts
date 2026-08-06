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

// ── Filtros ──────────────────────────────────────────────────────────────────

export interface ComplaintFilters {
  status?: ComplaintStatus;
  type?: ComplaintType;
  onlyOverdue?: boolean;
  sortBy?: 'submittedDate' | 'legalDeadline';
  sortDir?: 'asc' | 'desc';
}

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
