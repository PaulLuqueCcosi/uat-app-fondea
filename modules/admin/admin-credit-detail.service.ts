/**
 * Service para obtener el detalle de un crédito desde el admin.
 * Endpoints:
 *   - GET /api/v1/admin/credits/{id}/summary     → datos crudos del crédito
 *   - GET /api/v1/admin/credits/{id}/installments → cuotas
 *   - GET /api/v1/admin/credits/{id}/transactions → transacciones
 *   - GET /api/v1/admin/credits/{id}/audit        → auditoría del crédito
 */

import { backendFetch } from '@/lib/backend-fetch';

// ── Types: Summary (camelCase — backend usa @JsonNaming) ────────────────────

export type CreditStatus = 'ACTIVE' | 'OVERDUE' | 'DEFAULTED' | 'PAID_OFF';
export type DisbursementMethod = 'BANK_TRANSFER' | 'YAPE' | 'PLIN';
export type DisbursementStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface PenaltyRange {
  fromDay: number;
  toDay: number | null;
  type: string;
  value: number;
  base: string | null;
  label: string | null;
  color: string | null;
}

export interface PenaltyConfig {
  id: string;
  name: string;
  isActive: boolean;
  ranges: PenaltyRange[];
}

export interface ClientInfo {
  id: string;
  firstName: string | null;
  secondName: string | null;
  paternalSurname: string | null;
  maternalSurname: string | null;
  documentNumber: string | null;
}

export interface DisbursementInfo {
  id: string;
  loanId: string;
  amount: number;
  method: DisbursementMethod | null;
  destinationBank: string | null;
  destinationAccount: string | null;
  destinationHolder: string | null;
  referenceNumber: string | null;
  externalId: string | null;
  status: DisbursementStatus;
  failureReason: string | null;
  retryCount: number;
  disbursedAt: string | null;
  createdAt: string | null;
}

export interface AdminCreditSummary {
  id: string;
  userId: string;
  applicationId: string | null;
  status: CreditStatus;
  principal: number;
  totalDue: number;
  installmentCount: number;
  termDays: number;
  disbursedAt: string | null;
  firstDueDate: string;
  maturityDate: string;
  overdueSince: string | null;
  closedAt: string | null;
  penaltyConfigId: string | null;
  ubigeoRegion: string | null;
  ubigeoProvince: string | null;
  ubigeoDistrict: string | null;
  createdAt: string;
  updatedAt: string;
  client: ClientInfo | null;
  disbursement: DisbursementInfo | null;
  penaltyConfig: PenaltyConfig | null;
  approvalSnapshot: ApprovalSnapshot | null;
}

export interface ApprovalSnapshot {
  creditScore: number | null;
  passportPoints: number | null;
}

// ── Types: Installments (snake_case — backend usa @JsonProperty) ────────────

export type InstallmentStatus = 'PENDING' | 'CURRENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

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

export interface AdminCreditInstallments {
  credit_id: string;
  installments: InstallmentItem[];
}

// ── Types: Transactions (snake_case — backend usa @JsonProperty) ────────────

export type TransactionType = 'DISBURSEMENT' | 'REPAYMENT' | 'PENALTY_ACCRUAL' | 'PENALTY_PAYMENT' | 'REVERSAL';

export interface TransactionItem {
  id: string;
  type: TransactionType;
  amount: number;
  transaction_date: string;
  processed_at: string | null;
  installment_no: number | null;
  is_reversed: boolean;
  created_by: string | null;
  // TransactionDetail (joined)
  payment_method: string | null;
  reference_number: string | null;
  bank_name: string | null;
  account_origin: string | null;
  source: string | null;
  external_id: string | null;
  receipt_url: string | null;
}

export interface AdminCreditTransactions {
  credit_id: string;
  transactions: TransactionItem[];
}

// ── Types: Audit ────────────────────────────────────────────────────────────

export interface CreditAuditEvent {
  id: string;
  loanId: string;
  eventType: string;
  description: string;
  triggeredBy: string;
  createdAt: string;
}

// ── Services ────────────────────────────────────────────────────────────────

export async function getAdminCreditSummary(creditId: string): Promise<AdminCreditSummary | null> {
  const res = await backendFetch(`/api/v1/admin/credits/${creditId}/summary`, {
    context: 'ADMIN_CREDIT_SUMMARY',
  });
  if (!res.ok) {
    console.error(`[ADMIN_CREDIT_SUMMARY] Error ${res.status}`);
    return null;
  }
  return res.json();
}

export async function getAdminCreditInstallments(creditId: string): Promise<AdminCreditInstallments | null> {
  const res = await backendFetch(`/api/v1/admin/credits/${creditId}/installments`, {
    context: 'ADMIN_CREDIT_INSTALLMENTS',
  });
  if (!res.ok) {
    console.error(`[ADMIN_CREDIT_INSTALLMENTS] Error ${res.status}`);
    return null;
  }
  return res.json();
}

export async function getAdminCreditTransactions(creditId: string): Promise<AdminCreditTransactions | null> {
  const res = await backendFetch(`/api/v1/admin/credits/${creditId}/transactions`, {
    context: 'ADMIN_CREDIT_TRANSACTIONS',
  });
  if (!res.ok) {
    console.error(`[ADMIN_CREDIT_TRANSACTIONS] Error ${res.status}`);
    return null;
  }
  return res.json();
}

export async function getAdminCreditAudit(creditId: string): Promise<CreditAuditEvent[] | null> {
  const res = await backendFetch(`/api/v1/admin/credits/${creditId}/audit`, {
    context: 'ADMIN_CREDIT_AUDIT',
  });
  if (!res.ok) {
    console.error(`[ADMIN_CREDIT_AUDIT] Error ${res.status}`);
    return null;
  }
  return res.json();
}

// ── Types: Installment Detail ───────────────────────────────────────────────

export interface InstallmentTransactionInfo {
  id: string;
  type: TransactionType;
  amount: number;
  transactionDate: string;
  processedAt: string | null;
  isReversed: boolean;
  createdBy: string | null;
  paymentMethod: string | null;
  referenceNumber: string | null;
  bankName: string | null;
  accountOrigin: string | null;
  source: string | null;
  receiptUrl: string | null;
}

export interface InstallmentAuditEventDetail {
  id: string;
  eventType: string;
  description: string;
  triggeredBy: string;
  createdAt: string;
}

export interface AdminInstallmentDetail {
  id: string;
  loanId: string;
  installmentNo: number;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  penaltyAccrued: number;
  penaltyPaid: number;
  outstanding: number;
  penaltyOutstanding: number;
  installmentOutstanding: number;
  status: InstallmentStatus;
  daysOverdue: number;
  lastPenaltyDate: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  transactions: InstallmentTransactionInfo[];
  auditEvents: InstallmentAuditEventDetail[];
}

export async function getAdminInstallmentDetail(
  creditId: string,
  installmentNo: number,
): Promise<AdminInstallmentDetail | null> {
  const res = await backendFetch(
    `/api/v1/admin/credits/${creditId}/installments/${installmentNo}/detail`,
    { context: 'ADMIN_INSTALLMENT_DETAIL' },
  );
  if (!res.ok) {
    console.error(`[ADMIN_INSTALLMENT_DETAIL] Error ${res.status}`);
    return null;
  }
  return res.json();
}
