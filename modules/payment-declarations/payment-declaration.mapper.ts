/**
 * Mapper de Declaraciones de Pago — Backend (snake_case) → Frontend (camelCase).
 *
 * Si el backend cambia un campo, SOLO se toca este archivo.
 * NUNCA lanza excepciones — si un campo falta, usa valor default seguro.
 */

import type {
  InstallmentQuote,
  PaymentDeclaration,
  PaymentDeclarationDetail,
  PaymentDeclarationStatus,
  PaymentQuote,
  PaymentResult,
  PaymentResultDistribution,
  VoucherDetail,
  VoucherSummary,
} from './payment-declaration.types';

// ─── Declaración de pago ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPaymentDeclarationFromBackend(raw: any): PaymentDeclaration {
  return {
    id: raw.id ?? '',
    creditId: raw.credit_id ?? '',
    installmentNo: raw.installment_no ?? 0,
    userId: raw.user_id ?? '',
    status: mapPaymentDeclarationStatus(raw.status),
    declaredAmount: raw.declared_amount ?? 0,
    // Solo presentes si ya fue revisada (@JsonInclude NON_NULL en el backend)
    appliedAmount: raw.applied_amount ?? null,
    clientMessage: raw.client_message ?? null,
    reviewedBy: raw.reviewed_by ?? null,
    reviewedAt: raw.reviewed_at ?? null,
    createdAt: raw.created_at ?? '',
    vouchers: Array.isArray(raw.vouchers) ? raw.vouchers.map(mapVoucherFromBackend) : [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVoucherFromBackend(raw: any): VoucherSummary {
  return {
    id: raw.id ?? '',
    operationNumber: raw.operation_number ?? '',
    amount: raw.amount ?? 0,
  };
}

// ─── Helpers de mapeo de enums ────────────────────────────────────────────────

const VALID_STATUSES: PaymentDeclarationStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

function mapPaymentDeclarationStatus(raw: unknown): PaymentDeclarationStatus {
  const upper = String(raw ?? '').toUpperCase();
  return VALID_STATUSES.includes(upper as PaymentDeclarationStatus)
    ? (upper as PaymentDeclarationStatus)
    : 'PENDING';
}

// ─── Admin — detalle ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVoucherDetailFromBackend(raw: any): VoucherDetail {
  return {
    id: raw.id ?? '',
    operationNumber: raw.operation_number ?? '',
    amount: raw.amount ?? 0,
    photoUrl: raw.photo_url ?? '',
  };
}

// El sub-objeto payment_result viene en snake_case, igual que el resto del payload
// (PaymentResultResponse.java lo anota explícitamente con @JsonProperty).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPaymentResultDistribution(raw: any): PaymentResultDistribution {
  return {
    installmentNo: raw.installment_no ?? 0,
    appliedToPenalty: raw.applied_to_penalty ?? 0,
    appliedToInterest: raw.applied_to_interest ?? 0,
    appliedToPrincipal: raw.applied_to_principal ?? 0,
    appliedToInstallment: raw.applied_to_installment ?? 0,
    resultingStatus: raw.installment_status ?? '',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPaymentResultFromBackend(raw: any): PaymentResult {
  return {
    creditId: raw.credit_id ?? '',
    totalApplied: raw.total_applied ?? 0,
    remaining: raw.remaining ?? 0,
    creditStatus: raw.credit_status ?? '',
    distributions: Array.isArray(raw.distributions) ? raw.distributions.map(mapPaymentResultDistribution) : [],
  };
}

/**
 * Detalle completo de una declaración — PaymentDeclarationDetailResponse.
 * NUNCA lanza excepciones — si un campo falta, usa valor default seguro.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPaymentDeclarationDetailFromBackend(raw: any): PaymentDeclarationDetail {
  return {
    id: raw.id ?? '',
    creditId: raw.credit_id ?? '',
    installmentNo: raw.installment_no ?? 0,
    userId: raw.user_id ?? '',
    status: mapPaymentDeclarationStatus(raw.status),
    declaredAmount: raw.declared_amount ?? 0,
    appliedAmount: raw.applied_amount ?? null,
    appliedInstallmentNo: raw.applied_installment_no ?? null,
    targetChangeReason: raw.target_change_reason ?? null,
    clientMessage: raw.client_message ?? null,
    internalNote: raw.internal_note ?? null,
    reviewedBy: raw.reviewed_by ?? null,
    reviewedAt: raw.reviewed_at ?? null,
    createdAt: raw.created_at ?? '',
    vouchers: Array.isArray(raw.vouchers) ? raw.vouchers.map(mapVoucherDetailFromBackend) : [],
    creditOutstandingTotal: raw.credit_outstanding_total ?? 0,
    installmentOutstanding: raw.installment_outstanding ?? 0,
    exceedsTotalDebt: raw.exceeds_total_debt ?? false,
    possibleDuplicate: raw.possible_duplicate ?? false,
    duplicateDeclarationIds: Array.isArray(raw.duplicate_declaration_ids) ? raw.duplicate_declaration_ids : [],
    paymentResult: raw.payment_result ? mapPaymentResultFromBackend(raw.payment_result) : null,
  };
}

// ─── Cotización de pago (módulo `credit`) ─────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPaymentQuoteFromBackend(raw: any): PaymentQuote {
  return {
    creditId: raw.credit_id ?? '',
    targetInstallmentNo: raw.target_installment_no ?? 0,
    maximumAllowed: raw.maximum_allowed ?? 0,
    generatedAt: raw.generated_at ?? '',
    // El backend lo llama `penalty_synchronized_at`.
    penaltyTimestamp: raw.penalty_synchronized_at ?? '',
    fingerprint: raw.fingerprint ?? '',
    installments: Array.isArray(raw.installments)
      ? raw.installments.map(mapInstallmentQuoteFromBackend)
      : [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInstallmentQuoteFromBackend(raw: any): InstallmentQuote {
  return {
    installmentNo: raw.installment_no ?? 0,
    dueDate: raw.due_date ?? '',
    status: raw.status ?? 'PENDING',
    penalty: raw.penalty_pending ?? 0,
    interest: raw.interest_pending ?? 0,
    principal: raw.principal_pending ?? 0,
    total: raw.total_pending ?? 0,
    included: raw.included ?? false,
    isTarget: raw.is_target ?? false,
    negotiationCreditId: raw.negotiation_credit_id ?? null,
  };
}
