/**
 * Mapper de Créditos — Backend (snake_case) → Frontend (camelCase).
 *
 * Si el backend cambia un campo, SOLO se toca este archivo.
 * NUNCA lanza excepciones — si un campo falta, usa valor default seguro.
 */

import type {
  Credit,
  Installment,
  InstallmentDetail,
  CreditsSummary,
  PaymentRecord,
  CreditStatus,
  InstallmentStatus,
} from './credit.types';

// ─── Crédito ──────────────────────────────────────────────────────────────────

export function mapCreditFromBackend(raw: any): Credit {
  return {
    id: raw.id ?? '',
    amount: raw.amount ?? 0,
    disbursedDate: raw.disbursed_date ?? raw.disbursedDate ?? '',
    endDate: raw.end_date ?? raw.endDate ?? '',
    totalInstallments: raw.total_installments ?? raw.totalInstallments ?? 0,
    paidInstallments: raw.paid_installments ?? raw.paidInstallments ?? 0,
    paidAmount: raw.paid_amount ?? raw.paidAmount ?? 0,
    pendingBalance: raw.pending_balance ?? raw.pendingBalance ?? 0,
    interestRate: raw.interest_rate ?? raw.interestRate ?? 0,
    nextDueDate: raw.next_due_date ?? raw.nextDueDate ?? null,
    status: mapCreditStatus(raw.status),
    installments: Array.isArray(raw.installments)
      ? raw.installments.map(mapInstallmentFromBackend)
      : [],
  };
}

// ─── Cuota (resumen) ──────────────────────────────────────────────────────────

export function mapInstallmentFromBackend(raw: any): Installment {
  return {
    id: raw.id ?? '',
    number: raw.number ?? raw.installment_number ?? 0,
    amount: raw.amount ?? 0,
    dueDate: raw.due_date ?? raw.dueDate ?? '',
    paidDate: raw.paid_date ?? raw.paidDate ?? null,
    status: mapInstallmentStatus(raw.status),
  };
}

// ─── Cuota (detalle completo) ─────────────────────────────────────────────────

export function mapInstallmentDetailFromBackend(raw: any): InstallmentDetail {
  return {
    ...mapInstallmentFromBackend(raw),
    creditId: raw.credit_id ?? raw.creditId ?? '',
    totalInstallments: raw.total_installments ?? raw.totalInstallments ?? 0,
    principal: raw.principal ?? 0,
    interest: raw.interest ?? 0,
    lateFee: raw.late_fee ?? raw.lateFee ?? 0,
    totalDue: raw.total_due ?? raw.totalDue ?? raw.amount ?? 0,
    daysLate: raw.days_late ?? raw.daysLate ?? 0,
    method: raw.method ?? raw.payment_method ?? null,
    transactionId: raw.transaction_id ?? raw.transactionId ?? null,
    receiptUrl: raw.receipt_url ?? raw.receiptUrl ?? null,
  };
}

// ─── Resumen ──────────────────────────────────────────────────────────────────

export function mapCreditsSummaryFromBackend(raw: any): CreditsSummary {
  return {
    activeCount: raw.active_count ?? raw.activeCount ?? 0,
    completedCount: raw.completed_count ?? raw.completedCount ?? 0,
    overdueCount: raw.overdue_count ?? raw.overdueCount ?? 0,
    totalPendingBalance: raw.total_pending_balance ?? raw.totalPendingBalance ?? 0,
    totalPaidAmount: raw.total_paid_amount ?? raw.totalPaidAmount ?? 0,
  };
}

// ─── Pago ─────────────────────────────────────────────────────────────────────

export function mapPaymentFromBackend(raw: any): PaymentRecord {
  return {
    id: raw.id ?? '',
    installmentId: raw.installment_id ?? raw.installmentId ?? '',
    creditId: raw.credit_id ?? raw.creditId ?? '',
    installmentNumber: raw.installment_number ?? raw.installmentNumber ?? 0,
    totalInstallments: raw.total_installments ?? raw.totalInstallments ?? 0,
    amount: raw.amount ?? 0,
    dueDate: raw.due_date ?? raw.dueDate ?? '',
    paidDate: raw.paid_date ?? raw.paidDate ?? '',
    status: raw.status ?? 'PENDING',
    method: raw.method ?? raw.payment_method ?? null,
    receiptUrl: raw.receipt_url ?? raw.receiptUrl ?? null,
  };
}

// ─── Helpers de mapeo de enums ────────────────────────────────────────────────

const VALID_CREDIT_STATUSES: CreditStatus[] = ['ACTIVE', 'COMPLETED', 'OVERDUE', 'DEFAULTED'];
const VALID_INSTALLMENT_STATUSES: InstallmentStatus[] = ['PAID', 'PENDING', 'UPCOMING', 'OVERDUE'];

function mapCreditStatus(raw: any): CreditStatus {
  const upper = String(raw ?? '').toUpperCase();
  return VALID_CREDIT_STATUSES.includes(upper as CreditStatus)
    ? (upper as CreditStatus)
    : 'ACTIVE';
}

function mapInstallmentStatus(raw: any): InstallmentStatus {
  const upper = String(raw ?? '').toUpperCase();
  return VALID_INSTALLMENT_STATUSES.includes(upper as InstallmentStatus)
    ? (upper as InstallmentStatus)
    : 'UPCOMING';
}
