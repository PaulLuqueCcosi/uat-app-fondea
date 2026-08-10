/**
 * Types para el módulo admin de Cobranza (M3 — Collections).
 */

// ── R24 — Mora Clients ───────────────────────────────────────────────────────

export type ManagementStatus = 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | null;

export interface AdminMoraClientRow {
  creditId: string;
  userId: string;
  clientName: string;
  clientDocument: string;
  originalAmount: number;
  pendingBalance: number;
  accruedPenalty: number;
  daysOverdue: number;
  managementStatus: ManagementStatus;
}

export interface MoraClientsFilters {
  search?: string;
  city?: string;
  managementStatus?: string;
  minDaysOverdue?: number;
  sortBy?: 'daysOverdue' | 'pendingBalance' | 'accruedPenalty' | 'clientName';
  sortDir?: 'asc' | 'desc';
}

// ── R25 — Payment Agreements ─────────────────────────────────────────────────

export interface AgreementInstallment {
  installmentNo: number;
  amount: number;
  dueDate: string;
  daysUntilDue: number | null;
  paid: boolean;
}

export interface PaymentAgreement {
  agreementId: string;
  creditId: string;
  clientName: string;
  clientDocument: string;
  totalAmount: number;
  installments: AgreementInstallment[];
}

// ── R26-R30 — Analytics ──────────────────────────────────────────────────────

export interface NplByCityEntry {
  ubigeo_region: string;
  city_name: string;
  active_loans: number;
  overdue_loans: number;
  npl_rate: number;
  share_of_total_overdue: number;
}

export interface NplByCityResponse {
  cities: NplByCityEntry[];
  total_active_loans: number;
  total_overdue_loans: number;
  total_npl_rate: number;
}

export interface NplByChannelEntry {
  channel: string;
  active_loans: number;
  overdue_loans: number;
  npl_rate: number;
}

export interface NplByChannelResponse {
  channels: NplByChannelEntry[];
}

export interface NplByPassportLevelEntry {
  level: string;
  active_loans: number;
  overdue_loans: number;
  npl_rate: number;
}

export interface NplByPassportLevelResponse {
  levels: NplByPassportLevelEntry[];
}

export interface RecoveryRateResponse {
  ever_overdue_count: number;
  recovered_count: number;
  recovery_rate: number;
}

export interface NplTrendMonth {
  month: string;
  npl_rate: number;
  above_target: boolean;
}

export interface NplTrendResponse {
  target_rate: number;
  min_days_overdue: number;
  months: NplTrendMonth[];
}
