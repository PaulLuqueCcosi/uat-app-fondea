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
  CreditStatus,
  CreditType,
  InstallmentStatus,
  PenaltyConfigInfo,
  PenaltyRangeInfo,
} from './credit.types';

// ─── Crédito ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCreditFromBackend(raw: any): Credit {
  return {
    id: raw.id ?? '',
    status: mapCreditStatus(raw.status),
    creditType: mapCreditType(raw.credit_type),
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
    penaltyConfig: raw.penalty_config ? mapPenaltyConfigFromBackend(raw.penalty_config) : undefined,
    // Solo presentes si creditType = NEGOTIATION (@JsonInclude NON_NULL en el backend)
    originInstallmentId: raw.origin_installment_id ?? null,
    originCreditId: raw.origin_credit_id ?? null,
    rootCreditId: raw.root_credit_id ?? null,
  };
}

/**
 * Config de mora aplicada al crédito. El backend la manda en `penalty_config`, pero los
 * campos internos de cada rango vienen en camelCase (el record anidado no declara
 * @JsonProperty por campo, a diferencia del resto del DTO) — de ahí el doble fallback.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPenaltyConfigFromBackend(raw: any): PenaltyConfigInfo {
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    isActive: raw.is_active ?? raw.isActive ?? false,
    ranges: Array.isArray(raw.ranges) ? raw.ranges.map(mapPenaltyRangeFromBackend) : [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPenaltyRangeFromBackend(raw: any): PenaltyRangeInfo {
  return {
    fromDay: raw.fromDay ?? raw.from_day ?? 0,
    toDay: raw.toDay ?? raw.to_day ?? null,
    type: raw.type === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
    value: raw.value ?? 0,
    base: raw.base ?? null,
    label: raw.label ?? null,
    color: raw.color ?? null,
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
    // Solo presente si status = NEGOTIATED
    negotiationCreditId: raw.negotiation_credit_id ?? null,
    // Comprobante en revisión: la mora está congelada, la UI debe mostrar
    // "en revisión" en vez de "vencida".
    hasPendingDeclaration: raw.has_pending_declaration ?? false,
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

// El mapeo del resultado de un pago vive en `modules/payment-declarations` — es ese
// módulo el que aplica pagos y expone su resultado.

// ─── Helpers de mapeo de enums ────────────────────────────────────────────────

const VALID_CREDIT_STATUSES: CreditStatus[] = [
  'PENDING_DISBURSEMENT', 'ACTIVE', 'OVERDUE', 'SUSPENDED', 'WRITTEN_OFF', 'PAID_OFF',
];
const VALID_CREDIT_TYPES: CreditType[] = ['STANDARD', 'NEGOTIATION'];
const VALID_INSTALLMENT_STATUSES: InstallmentStatus[] = ['PENDING', 'CURRENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'NEGOTIATED'];

function mapCreditStatus(raw: unknown): CreditStatus {
  const upper = String(raw ?? '').toUpperCase();
  return VALID_CREDIT_STATUSES.includes(upper as CreditStatus)
    ? (upper as CreditStatus)
    : 'ACTIVE';
}

function mapCreditType(raw: unknown): CreditType {
  const upper = String(raw ?? '').toUpperCase();
  return VALID_CREDIT_TYPES.includes(upper as CreditType)
    ? (upper as CreditType)
    : 'STANDARD';
}

function mapInstallmentStatus(raw: unknown): InstallmentStatus {
  const upper = String(raw ?? '').toUpperCase();
  return VALID_INSTALLMENT_STATUSES.includes(upper as InstallmentStatus)
    ? (upper as InstallmentStatus)
    : 'PENDING';
}
