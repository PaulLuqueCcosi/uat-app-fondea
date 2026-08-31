/**
 * Tipos para la sección Scoring y Riesgo (M6 — R42-R44).
 * Endpoints: /api/v1/admin/scoring/analytics/*
 *
 * Distinto de scoring-config.* (Scorecard, reglas/pesos) — este archivo es
 * solo para los KPIs de analytics/riesgo.
 */

// ── R42 — Tasa de aprobación ──────────────────────────────────────────────────

export interface ApprovalTrendEntry {
  month: string;
  total: number;
  approved: number;
  rate: number;
}

export interface ApprovalRate {
  totalApplications: number;
  approvedApplications: number;
  approvalRate: number;
  trend: ApprovalTrendEntry[];
}

export interface ApprovalRateBackend {
  total_applications: number;
  approved_applications: number;
  approval_rate: number;
  trend: ApprovalTrendEntry[];
}

// ── R43 — NPL por banda de score ──────────────────────────────────────────────

export interface ScoreBandEntry {
  band: string;
  activeLoans: number;
  overdueLoans: number;
  nplRate: number;
}

export interface ScoreBandEntryBackend {
  band: string;
  active_loans: number;
  overdue_loans: number;
  npl_rate: number;
}

export interface NplByScoreBand {
  bands: ScoreBandEntry[];
}

export interface NplByScoreBandBackend {
  bands: ScoreBandEntryBackend[];
}

// ── R44 — Consultas por API ───────────────────────────────────────────────────

export type ApiProvider = 'SENTINEL' | 'RENIEC' | 'REKOGNITION' | string;

export interface ApiUsageEntry {
  api: ApiProvider;
  queryCount: number;
}

export interface ApiUsageEntryBackend {
  api: ApiProvider;
  query_count: number;
}

export interface ApiUsage {
  apis: ApiUsageEntry[];
}

export interface ApiUsageBackend {
  apis: ApiUsageEntryBackend[];
}
