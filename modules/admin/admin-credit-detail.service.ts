/**
 * Service para obtener el detalle completo de un crédito desde el admin.
 * Usa el endpoint /api/v1/admin/credits/{id}/full-detail
 */

import { backendFetch } from '@/lib/backend-fetch';

// ── Types ───────────────────────────────────────────────────────────────────

export type CreditStatus = 'ACTIVE' | 'OVERDUE' | 'DEFAULTED' | 'PAID_OFF';
export type InstallmentStatus = 'PENDING' | 'CURRENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
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
export type TransactionType = 'DISBURSEMENT' | 'REPAYMENT' | 'PENALTY_ACCRUAL' | 'PENALTY_PAYMENT' | 'REVERSAL';

export interface PenaltyRange {
  from_day: number;
  to_day: number | null;
  type: string;
  value: number;
  base: string | null;
  label: string | null;
  color: string | null;
}

export interface PenaltyConfig {
  id: string;
  name: string;
  is_active: boolean;
  ranges: PenaltyRange[];
}

export interface ClientInfo {
  user_id: string;
  full_name: string | null;
  document_number: string | null;
  fondea_score: number | null;
  passport_points: number | null;
}

export interface ApplicationInfo {
  application_id: string;
  status: ApplicationStatus | null;
  submitted_at: string | null;
  evaluated_at: string | null;
  credit_score: number | null;
  rejection_reason: string | null;
  contract_status: string | null;
  contract_id: string | null;
}

export interface DisbursementInfo {
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

export interface InstallmentItem {
  id: string;
  installment_no: number;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  penalty_accrued: number;
  penalty_paid: number;
  outstanding: number;
  status: InstallmentStatus;
  days_overdue: number;
  paid_at: string | null;
}

export interface TransactionInfo {
  id: string;
  type: TransactionType;
  amount: number;
  transaction_date: string;
  processed_at: string | null;
  installment_no: number | null;
  is_reversed: boolean;
  created_by: string | null;
  payment_method: string | null;
  reference_number: string | null;
  bank_name: string | null;
  receipt_url: string | null;
}

export interface CreditAuditEventInfo {
  id: string;
  event_type: string;
  description: string;
  triggered_by: string;
  created_at: string;
}

export interface InstallmentAuditEventInfo {
  id: string;
  installment_no: number;
  event_type: string;
  description: string;
  triggered_by: string;
  created_at: string;
}

export interface DocStatusInfo {
  status: string;
  result: string | null;
  rejection_reason: string | null;
  attempts: number | null;
  failed_attempts: number | null;
}

export interface VerificationInfo {
  overall: string;
  dni_front: DocStatusInfo | null;
  dni_back: DocStatusInfo | null;
  selfie: DocStatusInfo | null;
}

export interface DocumentFileInfo {
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

export interface DocumentsInfo {
  verification: VerificationInfo | null;
  files: DocumentFileInfo[];
}

export interface AdminCreditFullDetail {
  id: string;
  status: CreditStatus;
  principal: number;
  total_due: number;
  total_paid: number;
  total_penalty: number;
  total_outstanding: number;
  term_days: number;
  installment_count: number;
  installments_completed: number;
  installments_overdue: number;
  interest_rate: number;
  disbursed_at: string | null;
  first_due_date: string;
  maturity_date: string;
  overdue_since: string | null;
  closed_at: string | null;
  days_remaining: number;
  penalty_config: PenaltyConfig | null;
  client: ClientInfo | null;
  application: ApplicationInfo | null;
  disbursement: DisbursementInfo | null;
  installments: InstallmentItem[];
  transactions: TransactionInfo[];
  credit_audit_events: CreditAuditEventInfo[];
  installment_audit_events: InstallmentAuditEventInfo[];
  documents: DocumentsInfo | null;
}

// ── Service ─────────────────────────────────────────────────────────────────

export async function getAdminCreditFullDetail(creditId: string): Promise<AdminCreditFullDetail | null> {
  const res = await backendFetch(`/api/v1/admin/credits/${creditId}/full-detail`, {
    context: 'ADMIN_CREDIT_FULL_DETAIL',
  });

  if (!res.ok) {
    console.error(`[ADMIN_CREDIT_FULL_DETAIL] Error ${res.status}`);
    return null;
  }

  return res.json();
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getInstallmentAuditEventsForNo(
  events: InstallmentAuditEventInfo[],
  installmentNo: number
): InstallmentAuditEventInfo[] {
  return events.filter((e) => e.installment_no === installmentNo);
}
