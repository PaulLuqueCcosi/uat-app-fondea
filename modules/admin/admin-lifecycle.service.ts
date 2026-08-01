/**
 * Service para el ciclo de vida completo de una solicitud (admin).
 * Endpoint: GET /api/v1/admin/applications/{id}/lifecycle
 */

import { backendFetch } from '@/lib/backend-fetch';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ApplicationLifecycle {
  applicationId: string;
  user: UserSummary | null;
  origin: Origin | null;
  application: ApplicationSummary | null;
  loanDetail: LoanDetail | null;
  timeline: TimelineEvent[];
  documents: DocumentsSummary | null;
  credit: CreditSummary | null;
  forms: FormEntry[] | null;
  pep: PepDeclarations | null;
}

export interface UserSummary {
  id: string;
  name: string;
  document_number: string | null;
}

export interface Origin {
  type: 'anonymous' | 'direct';
  anonymous: AnonymousIntention | null;
  userIntention: UserIntention | null;
}

export interface AnonymousIntention {
  id: string;
  client_ip: string | null;
  amount: number;
  termDays: number;
  installmentCount: number;
  is_first_loan: boolean;
  selected_range_code: string | null;
  created_at: string;
  metadata: string | null;
}

export interface UserIntention {
  id: string;
  product_id: string;
  amount: number;
  termDays: number;
  installmentCount: number;
  is_first_loan: boolean;
  calculator_intention_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationSummary {
  status: ApplicationStatus;
  submitted_at: string | null;
  evaluated_at: string | null;
  expires_at: string | null;
  credit_score: number | null;
  rejection_reason: string | null;
  can_retry_at: string | null;
  failure_code: string | null;
  evaluation_step: string | null;
  evaluation_error: string | null;
  contract_id: string | null;
  contract_status: string | null;
  submitted_profile_snapshot: string | null;
  submitted_intention_snapshot: string | null;
  submitted_puntaje_snapshot: string | null;
  device_fingerprint_snapshot: string | null;
}

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'PRE_APPROVED'
  | 'APPROVED'
  | 'REJECTED'
  | 'REJECTED_BY_USER'
  | 'FAILED'
  | 'BLOCKED'
  | 'EXPIRED';

export interface LoanDetail {
  product_id: string;
  product_name: string;
  principal: number;
  term_days: number;
  installment_count: number;
  is_first_loan: boolean;
  credit_score_used: number | null;
  total_fees_original: number;
  total_discounts: number;
  total_igv: number;
  total_to_pay: number;
  monthly_payment: number;
  first_due_date: string;
  requested_amount: number;
  approved_amount: number;
  was_limit_adjusted: boolean;
  score_limit_amount: number;
  limit_note: string | null;
  schedule: InstallmentEntry[];
}

export interface InstallmentEntry {
  installment_no: number;
  due_date: string;
  amount: number;
}

export interface TimelineEvent {
  id: string;
  event: string;
  detail: string | null;
  created_at: string;
}

export interface DocumentsSummary {
  verification: Verification | null;
  files: DocumentFile[];
}

export interface Verification {
  overall: string;
  dni_front: DocStatus;
  dni_back: DocStatus;
  selfie: DocStatus;
}

export interface DocStatus {
  status: string;
  result: string | null;
  rejection_reason: string | null;
  attempts: number;
  failed_attempts: number;
}

export interface DocumentFile {
  id: string;
  type: string;
  file_name: string;
  file_size_bytes: number;
  content_type: string;
  storage_url: string | null;
  status: string;
  rejection_reason: string | null;
  uploaded_at: string;
}

export interface CreditSummary {
  id: string;
  status: CreditStatus;
  principal: number;
  total_due: number;
  total_paid: number;
  total_penalty: number;
  total_outstanding: number;
  installment_count: number;
  installments_completed: number;
  installments_overdue: number;
  disbursed_at: string | null;
  first_due_date: string;
  maturity_date: string;
  overdue_since: string | null;
  closed_at: string | null;
  installments: InstallmentItem[];
  disbursement: DisbursementItem | null;
  transactions: TransactionItem[];
  statusChanges: StatusChangeItem[];
}

import type { CreditStatus } from './mock-data';
export type { CreditStatus } from './mock-data';

export interface InstallmentItem {
  id: string;
  installment_no: number;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  penalty_accrued: number;
  penalty_paid: number;
  status: string;
  days_overdue: number;
  paid_at: string | null;
}

export interface DisbursementItem {
  id: string;
  amount: number;
  method: string | null;
  destination_bank: string | null;
  destination_account: string | null;
  destination_holder: string | null;
  reference_number: string | null;
  status: string;
  failure_reason: string | null;
  disbursed_at: string | null;
}

export interface TransactionItem {
  id: string;
  type: string;
  amount: number;
  transaction_date: string;
  is_reversed: boolean;
  created_by: string | null;
}

export interface StatusChangeItem {
  id: string;
  from_status: string | null;
  to_status: string | null;
  changed_by: string | null;
  reason: string | null;
  changed_at: string;
}

export interface FormEntry {
  key: string;
  name: string;
  completed: boolean;
  completed_at: string | null;
}

export interface PepDeclarations {
  not_pep: boolean;
  not_pep_relative: boolean;
  accept_terms: boolean;
}

// ── API ─────────────────────────────────────────────────────────────────────

export async function getApplicationLifecycle(id: string): Promise<ApplicationLifecycle | null> {
  const res = await backendFetch(`/api/v1/admin/applications/${id}/lifecycle`, {
    context: 'ADMIN_APPLICATION_LIFECYCLE',
  });

  if (!res.ok) {
    console.error(`[ADMIN_APPLICATION_LIFECYCLE] Error ${res.status}`);
    return null;
  }

  return res.json();
}

/**
 * Endpoint universal: acepta cualquier ID (intención, solicitud, crédito)
 */
export async function getUniversalLifecycle(id: string): Promise<ApplicationLifecycle | null> {
  const res = await backendFetch(`/api/v1/admin/lifecycle/${id}`, {
    context: 'ADMIN_UNIVERSAL_LIFECYCLE',
  });

  if (!res.ok) {
    console.error(`[ADMIN_UNIVERSAL_LIFECYCLE] Error ${res.status}`);
    return null;
  }

  return res.json();
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<ApplicationStatus, { label: string; color: string }> = {
  SUBMITTED: { label: 'Enviada', color: 'secondary' },
  PROCESSING: { label: 'Evaluando', color: 'default' },
  PRE_APPROVED: { label: 'Pre-aprobada', color: 'warning' },
  APPROVED: { label: 'Aprobada', color: 'success' },
  REJECTED: { label: 'Rechazada', color: 'destructive' },
  REJECTED_BY_USER: { label: 'Rechazada (usuario)', color: 'secondary' },
  FAILED: { label: 'Fallida', color: 'destructive' },
  BLOCKED: { label: 'Bloqueada', color: 'destructive' },
  EXPIRED: { label: 'Expirada', color: 'secondary' },
};

export const EVENT_LABELS: Record<string, string> = {
  SUBMITTED: 'Solicitud recibida',
  VALIDATION_DISPATCHED: 'Validación enviada',
  VALIDATION_COMPLETED: 'Validación completada',
  VALIDATION_FAILED: 'Validación fallida',
  SCORING_DISPATCHED: 'Scoring enviado',
  SCORING_COMPLETED: 'Score calculado',
  SCORING_FAILED: 'Scoring fallido',
  PRE_APPROVED: 'Pre-aprobada',
  REJECTED: 'Rechazada',
  FAILED: 'Error técnico',
};

export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  UPLOADED: 'Subido',
  PROCESSING: 'Procesando',
  VERIFIED: 'Verificado',
  REJECTED: 'Rechazado',
  FAILED: 'Fallido',
};

// ── Navegación auxiliar ─────────────────────────────────────────────────────

export async function getApplicationIdByIntention(intentionId: string): Promise<string | null> {
  const res = await backendFetch(`/api/v1/admin/intentions/${intentionId}/application`, {
    context: 'ADMIN_NAVIGATION',
  });
  if (!res.ok) return null;
  const body = await res.json();
  return body.id ?? null;
}

export async function getApplicationIdByCredit(creditId: string): Promise<string | null> {
  const res = await backendFetch(`/api/v1/admin/credits/${creditId}/application`, {
    context: 'ADMIN_NAVIGATION',
  });
  if (!res.ok) return null;
  const body = await res.json();
  return body.id ?? null;
}

export async function getApplicationIdByAnonymousIntention(anonymousIntentionId: string): Promise<string | null> {
  // 1. Buscar intención de usuario vinculada
  const res1 = await backendFetch(`/api/v1/admin/calculator-intentions/${anonymousIntentionId}/linked`, {
    context: 'ADMIN_NAVIGATION',
  });
  if (!res1.ok) return null;
  const body1 = await res1.json();
  const userIntentionId = body1.id ?? null;
  if (!userIntentionId) return null;

  // 2. Buscar solicitud vinculada a esa intención de usuario
  return getApplicationIdByIntention(userIntentionId);
}
