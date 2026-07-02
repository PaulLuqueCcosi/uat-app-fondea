/**
 * Mapper de Créditos — Backend (snake_case) → Frontend (camelCase).
 *
 * Si el backend cambia un campo, SOLO se toca este archivo.
 * NUNCA lanza excepciones — si un campo falta, usa valor default seguro.
 */

import type {
  Credit,
  Installment,
  CreditSummary,
  NextPayment,
  Transaction,
  PaymentResult,
  PaymentDistribution,
  CreditStatus,
  InstallmentStatus,
} from './credit.types';

// ─── Crédito ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCreditFromBackend(raw: any): Credit {
  return {
    id: raw.id ?? '',
    status: mapCreditStatus(raw.status),
    principal: raw.principal ?? 0,
    totalDue: raw.total_due ?? 0,
    totalPaid: raw.total_paid ?? 0,
    totalPenalty: raw.total_penalty ?? 0,
    totalOutstanding: raw.total_outstanding ?? 0,
    installmentCount: raw.installment_count ?? 0,
    installmentsCompleted: raw.installments_completed ?? 0,
    installmentsOverdue: raw.installments_overdue ?? 0,
    disbursedAt: raw.disbursed_at ?? '',
    firstDueDate: raw.first_due_date ?? '',
    maturityDate: raw.maturity_date ?? '',
    overdueSince: raw.overdue_since ?? null,
    closedAt: raw.closed_at ?? null,
  };
}

// ─── Cuota ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapInstallmentFromBackend(raw: any): Installment {
  return {
    id: raw.id ?? '',
    installmentNo: raw.installment_no ?? 0,
    dueDate: raw.due_date ?? '',
    amountDue: raw.amount_due ?? 0,
    amountPaid: raw.amount_paid ?? 0,
    penaltyAccrued: raw.penalty_accrued ?? 0,
    penaltyPaid: raw.penalty_paid ?? 0,
    outstanding: raw.outstanding ?? 0,
    status: mapInstallmentStatus(raw.status),
    daysOverdue: raw.days_overdue ?? 0,
    paidAt: raw.paid_at ?? null,
  };
}

// ─── Resumen ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCreditSummaryFromBackend(raw: any): CreditSummary {
  return {
    creditId: raw.credit_id ?? '',
    totalDue: raw.total_due ?? 0,
    totalPaid: raw.total_paid ?? 0,
    totalPenaltyAccrued: raw.total_penalty_accrued ?? 0,
    totalPenaltyPaid: raw.total_penalty_paid ?? 0,
    totalOutstanding: raw.total_outstanding ?? 0,
    progressPercentage: raw.progress_percentage ?? 0,
  };
}

// ─── Próximo pago ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapNextPaymentFromBackend(raw: any): NextPayment {
  return {
    creditId: raw.credit_id ?? '',
    installmentNo: raw.installment_no ?? 0,
    dueDate: raw.due_date ?? '',
    amountDue: raw.amount_due ?? 0,
    amountPaid: raw.amount_paid ?? 0,
    penaltyAccrued: raw.penalty_accrued ?? 0,
    totalToPay: raw.total_to_pay ?? 0,
    status: mapInstallmentStatus(raw.status),
    daysOverdue: raw.days_overdue ?? 0,
    isOverdue: raw.is_overdue ?? false,
  };
}

// ─── Transacción ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapTransactionFromBackend(raw: any): Transaction {
  return {
    id: raw.id ?? '',
    type: raw.type ?? 'REPAYMENT',
    amount: raw.amount ?? 0,
    transactionDate: raw.transaction_date ?? '',
    processedAt: raw.processed_at ?? '',
    installmentNo: raw.installment_no ?? null,
    isReversed: raw.is_reversed ?? false,
    createdBy: raw.created_by ?? '',
  };
}

// ─── Resultado de pago ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPaymentResultFromBackend(raw: any): PaymentResult {
  return {
    creditId: raw.credit_id ?? '',
    totalApplied: raw.total_applied ?? 0,
    remaining: raw.remaining ?? 0,
    creditStatus: raw.credit_status ?? '',
    distributions: Array.isArray(raw.distributions)
      ? raw.distributions.map(mapDistributionFromBackend)
      : [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDistributionFromBackend(raw: any): PaymentDistribution {
  return {
    installmentNo: raw.installment_no ?? 0,
    appliedToPenalty: raw.applied_to_penalty ?? 0,
    appliedToInstallment: raw.applied_to_installment ?? 0,
    installmentStatus: raw.installment_status ?? '',
  };
}

// ─── Helpers de mapeo de enums ────────────────────────────────────────────────

const VALID_CREDIT_STATUSES: CreditStatus[] = ['ACTIVE', 'OVERDUE', 'DEFAULTED', 'PAID_OFF'];
const VALID_INSTALLMENT_STATUSES: InstallmentStatus[] = ['PENDING', 'CURRENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'];

function mapCreditStatus(raw: unknown): CreditStatus {
  const upper = String(raw ?? '').toUpperCase();
  return VALID_CREDIT_STATUSES.includes(upper as CreditStatus)
    ? (upper as CreditStatus)
    : 'ACTIVE';
}

function mapInstallmentStatus(raw: unknown): InstallmentStatus {
  const upper = String(raw ?? '').toUpperCase();
  return VALID_INSTALLMENT_STATUSES.includes(upper as InstallmentStatus)
    ? (upper as InstallmentStatus)
    : 'PENDING';
}
