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

// Los enums de estado viven en `credit-status-labels.ts` junto a sus etiquetas.
import type { CreditStatus, InstallmentStatus } from './credit-status-labels';
export type { CreditStatus, InstallmentStatus } from './credit-status-labels';

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

export type CreditType = 'STANDARD' | 'NEGOTIATION';

export interface AdminCreditSummary {
  id: string;
  userId: string;
  applicationId: string | null;
  status: CreditStatus;
  creditType: CreditType;
  /** Solo presentes si creditType = NEGOTIATION */
  originInstallmentId?: string | null;
  originCreditId?: string | null;
  rootCreditId?: string | null;
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

// `InstallmentStatus` se importa/reexporta arriba desde `credit-status-labels.ts`.

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
  /** Solo presente si status = NEGOTIATED — el crédito que asumió esta deuda */
  negotiation_credit_id?: string | null;
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

// ── Types: Timeline (camelCase — sin @JsonNaming/@JsonProperty en el DTO) ────

export type CreditAuditModule = 'CORE' | 'PAYMENT' | 'PENALTY' | 'NEGOTIATION' | 'AUDIT';
export type CreditAuditOutcome = 'SUCCESS' | 'FAILURE';
export type CreditActorType = 'SYSTEM' | 'USER' | 'ADMIN';

export interface CreditAuditEntry {
  id: string;
  module: CreditAuditModule;
  eventType: string;
  outcome: CreditAuditOutcome;
  actorType: CreditActorType;
  actorId: string | null;
  message: string | null;
  detail: string | null;
  refId: string | null;
  occurredAt: string;
}

// ── Services ────────────────────────────────────────────────────────────────

/**
 * Mapea la respuesta cruda del backend (snake_case — el DTO usa
 * @JsonNaming(SnakeCaseStrategy)) a AdminCreditSummary (camelCase).
 *
 * ⚠️ Antes de agregar creditType/origin este endpoint se leía con
 * `res.json()` directo sin mapear — asumía camelCase cuando el backend
 * en realidad manda snake_case (user_id, total_due, client.first_name...).
 * Los campos anidados (client, disbursement, penaltyConfig) también vienen
 * en snake_case y se normalizan aquí.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAdminCreditSummaryFromBackend(raw: any): AdminCreditSummary {
  return {
    id: raw.id ?? '',
    userId: raw.user_id ?? '',
    applicationId: raw.application_id ?? null,
    status: raw.status ?? 'ACTIVE',
    creditType: raw.credit_type ?? 'STANDARD',
    originInstallmentId: raw.origin_installment_id ?? null,
    originCreditId: raw.origin_credit_id ?? null,
    rootCreditId: raw.root_credit_id ?? null,
    principal: raw.principal ?? 0,
    totalDue: raw.total_due ?? 0,
    installmentCount: raw.installment_count ?? 0,
    termDays: raw.term_days ?? 0,
    disbursedAt: raw.disbursed_at ?? null,
    firstDueDate: raw.first_due_date ?? '',
    maturityDate: raw.maturity_date ?? '',
    overdueSince: raw.overdue_since ?? null,
    closedAt: raw.closed_at ?? null,
    penaltyConfigId: raw.penalty_config_id ?? null,
    ubigeoRegion: raw.ubigeo_region ?? null,
    ubigeoProvince: raw.ubigeo_province ?? null,
    ubigeoDistrict: raw.ubigeo_district ?? null,
    createdAt: raw.created_at ?? '',
    updatedAt: raw.updated_at ?? '',
    client: raw.client
      ? {
          id: raw.client.id ?? '',
          firstName: raw.client.first_name ?? null,
          secondName: raw.client.second_name ?? null,
          paternalSurname: raw.client.paternal_surname ?? null,
          maternalSurname: raw.client.maternal_surname ?? null,
          documentNumber: raw.client.document_number ?? null,
        }
      : null,
    disbursement: raw.disbursement
      ? {
          id: raw.disbursement.id ?? '',
          loanId: raw.disbursement.loan_id ?? '',
          amount: raw.disbursement.amount ?? 0,
          method: raw.disbursement.method ?? null,
          destinationBank: raw.disbursement.destination_bank ?? null,
          destinationAccount: raw.disbursement.destination_account ?? null,
          destinationHolder: raw.disbursement.destination_holder ?? null,
          referenceNumber: raw.disbursement.reference_number ?? null,
          externalId: raw.disbursement.external_id ?? null,
          status: raw.disbursement.status ?? 'PENDING',
          failureReason: raw.disbursement.failure_reason ?? null,
          retryCount: raw.disbursement.retry_count ?? 0,
          disbursedAt: raw.disbursement.disbursed_at ?? null,
          createdAt: raw.disbursement.created_at ?? null,
        }
      : null,
    penaltyConfig: raw.penalty_config
      ? {
          id: raw.penalty_config.id ?? '',
          name: raw.penalty_config.name ?? '',
          isActive: raw.penalty_config.is_active ?? false,
          // Defensivo: el ejemplo de la doc omite el shape exacto de ranges para
          // este endpoint — soporta snake_case y camelCase por si acaso.
          ranges: Array.isArray(raw.penalty_config.ranges)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? raw.penalty_config.ranges.map((r: any) => ({
                fromDay: r.fromDay ?? r.from_day ?? 0,
                toDay: r.toDay ?? r.to_day ?? null,
                type: r.type ?? '',
                value: r.value ?? 0,
                base: r.base ?? null,
                label: r.label ?? null,
                color: r.color ?? null,
              }))
            : [],
        }
      : null,
    approvalSnapshot: raw.approval_snapshot
      ? {
          creditScore: raw.approval_snapshot.credit_score ?? null,
          passportPoints: raw.approval_snapshot.passport_points ?? null,
        }
      : null,
  };
}

// ── Types: Detail (totales calculados + cuotas negociadas) ──────────────────

/**
 * Balance de un crédito — mismo shape que CreditSummaryResponse del backend,
 * reusado tal cual para el balance del crédito de negociación de cada cuota
 * movida (ver NegotiatedInstallmentSummary).
 */
export interface CreditFinancialSummary {
  creditId: string;
  totalDue: number;
  totalPaid: number;
  totalPenaltyAccrued: number;
  totalPenaltyPaid: number;
  totalOutstanding: number;
  progressPercentage: number;
}

export interface NegotiatedInstallmentSummary {
  installmentNo: number;
  negotiationCreditId: string;
  /** Null si el crédito de negociación no se pudo cargar (no debería pasar). */
  summary: CreditFinancialSummary | null;
}

/**
 * Totales calculados de GET /api/v1/admin/credits/{id}/detail — fuente de verdad
 * para totalPaid/totalPenalty/totalOutstanding, NUNCA recalcular esto sumando
 * `installments[].outstanding` a mano: una cuota NEGOTIATED queda con su
 * outstanding congelado al monto que tenía al negociarse, y sumarla infla el
 * pendiente (ver bug arreglado en page.tsx / CreditInstallmentsSection).
 */
export interface AdminCreditDetail {
  totalPaid: number;
  totalPenalty: number;
  totalOutstanding: number;
  installmentsCompleted: number;
  installmentsOverdue: number;
  negotiatedInstallments: NegotiatedInstallmentSummary[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCreditFinancialSummaryFromBackend(raw: any): CreditFinancialSummary {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAdminCreditDetailFromBackend(raw: any): AdminCreditDetail {
  return {
    totalPaid: raw.total_paid ?? 0,
    totalPenalty: raw.total_penalty ?? 0,
    totalOutstanding: raw.total_outstanding ?? 0,
    installmentsCompleted: raw.installments_completed ?? 0,
    installmentsOverdue: raw.installments_overdue ?? 0,
    negotiatedInstallments: Array.isArray(raw.negotiated_installments)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.negotiated_installments.map((n: any) => ({
          installmentNo: n.installment_no ?? 0,
          negotiationCreditId: n.negotiation_credit_id ?? '',
          summary: n.summary ? mapCreditFinancialSummaryFromBackend(n.summary) : null,
        }))
      : [],
  };
}

/**
 * Totales del crédito (totalPaid/totalPenalty/totalOutstanding + cuotas
 * negociadas). Complementa a getAdminCreditSummary (que trae datos crudos —
 * cliente, desembolso, config de mora — sin ningún cálculo a propósito).
 */
export async function getAdminCreditDetail(creditId: string): Promise<AdminCreditDetail | null> {
  const res = await backendFetch(`/api/v1/admin/credits/${creditId}/detail`, {
    context: 'ADMIN_CREDIT_DETAIL',
  });
  if (!res.ok) {
    console.error(`[ADMIN_CREDIT_DETAIL] Error ${res.status}`);
    return null;
  }
  const raw = await res.json();
  return mapAdminCreditDetailFromBackend(raw);
}

export async function getAdminCreditSummary(creditId: string): Promise<AdminCreditSummary | null> {
  const res = await backendFetch(`/api/v1/admin/credits/${creditId}/summary`, {
    context: 'ADMIN_CREDIT_SUMMARY',
  });
  if (!res.ok) {
    console.error(`[ADMIN_CREDIT_SUMMARY] Error ${res.status}`);
    return null;
  }
  const raw = await res.json();
  return mapAdminCreditSummaryFromBackend(raw);
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

export async function getAdminCreditTimeline(creditId: string): Promise<CreditAuditEntry[] | null> {
  const res = await backendFetch(`/api/v1/admin/credits/${creditId}/timeline`, {
    context: 'ADMIN_CREDIT_TIMELINE',
  });
  if (!res.ok) {
    console.error(`[ADMIN_CREDIT_TIMELINE] Error ${res.status}`);
    return null;
  }
  return res.json();
}

// ── Types: Installment Detail ───────────────────────────────────────────────

/**
 * No incluye externalId/rawPayload/metadata a propósito — son para cuando se
 * conecte una pasarela de pagos real (hoy todo es source=manual). Agregar recién
 * ahí, tanto acá como en AdminInstallmentDetailResponse.TransactionInfo (backend).
 */
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
  /** Solo presente si status = NEGOTIATED — el crédito que asumió esta deuda */
  negotiationCreditId?: string | null;
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
  const raw = await res.json();
  return mapAdminInstallmentDetailFromBackend(raw);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAdminInstallmentDetailFromBackend(raw: any): AdminInstallmentDetail {
  return {
    id: raw.id ?? '',
    loanId: raw.loan_id ?? raw.loanId ?? '',
    installmentNo: raw.installment_no ?? raw.installmentNo ?? 0,
    dueDate: raw.due_date ?? raw.dueDate ?? '',
    amountDue: raw.amount_due ?? raw.amountDue ?? 0,
    amountPaid: raw.amount_paid ?? raw.amountPaid ?? 0,
    penaltyAccrued: raw.penalty_accrued ?? raw.penaltyAccrued ?? 0,
    penaltyPaid: raw.penalty_paid ?? raw.penaltyPaid ?? 0,
    outstanding: raw.outstanding ?? 0,
    penaltyOutstanding: raw.penalty_outstanding ?? raw.penaltyOutstanding ?? 0,
    installmentOutstanding: raw.installment_outstanding ?? raw.installmentOutstanding ?? 0,
    status: raw.status ?? 'PENDING',
    daysOverdue: raw.days_overdue ?? raw.daysOverdue ?? 0,
    lastPenaltyDate: raw.last_penalty_date ?? raw.lastPenaltyDate ?? null,
    paidAt: raw.paid_at ?? raw.paidAt ?? null,
    createdAt: raw.created_at ?? raw.createdAt ?? '',
    updatedAt: raw.updated_at ?? raw.updatedAt ?? '',
    negotiationCreditId: raw.negotiation_credit_id ?? raw.negotiationCreditId ?? null,
    transactions: Array.isArray(raw.transactions)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.transactions.map((tx: any) => ({
          id: tx.id ?? '',
          type: tx.type ?? 'REPAYMENT',
          amount: tx.amount ?? 0,
          transactionDate: tx.transaction_date ?? tx.transactionDate ?? '',
          processedAt: tx.processed_at ?? tx.processedAt ?? null,
          isReversed: tx.is_reversed ?? tx.isReversed ?? false,
          createdBy: tx.created_by ?? tx.createdBy ?? null,
          paymentMethod: tx.payment_method ?? tx.paymentMethod ?? null,
          referenceNumber: tx.reference_number ?? tx.referenceNumber ?? null,
          bankName: tx.bank_name ?? tx.bankName ?? null,
          accountOrigin: tx.account_origin ?? tx.accountOrigin ?? null,
          source: tx.source ?? null,
          receiptUrl: tx.receipt_url ?? tx.receiptUrl ?? null,
        }))
      : [],
    auditEvents: Array.isArray(raw.audit_events ?? raw.auditEvents)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (raw.audit_events ?? raw.auditEvents ?? []).map((e: any) => ({
          id: e.id ?? '',
          eventType: e.event_type ?? e.eventType ?? '',
          description: e.description ?? e.message ?? '',
          triggeredBy: e.triggered_by ?? e.triggeredBy ?? '',
          createdAt: e.created_at ?? e.createdAt ?? '',
        }))
      : [],
  };
}
