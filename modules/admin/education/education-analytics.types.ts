/**
 * Tipos para la sección Educación Financiera (M10 — R51, R52).
 * Endpoints: /api/v1/admin/education/analytics/*
 */

// ── R51 — Tasa de acceso a módulos ────────────────────────────────────────────

export interface ModuleAccessRate {
  moduleId: string;
  moduleOrder: number;
  moduleTitle: string;
  accessedCount: number;
  activeClientsTotal: number;
  accessRatePercent: number;
}

export interface ModuleAccessRateBackend {
  module_id: string;
  module_order: number;
  module_title: string;
  accessed_count: number;
  active_clients_total: number;
  access_rate_percent: number;
}

// ── R52 — Correlación educación-mora ──────────────────────────────────────────

export interface MoraCorrelation {
  accessedClientsTotal: number;
  accessedClientsInMora: number;
  accessedMoraRatePercent: number;
  notAccessedClientsTotal: number;
  notAccessedClientsInMora: number;
  notAccessedMoraRatePercent: number;
}

export interface MoraCorrelationBackend {
  accessed_clients_total: number;
  accessed_clients_in_mora: number;
  accessed_mora_rate_percent: number;
  not_accessed_clients_total: number;
  not_accessed_clients_in_mora: number;
  not_accessed_mora_rate_percent: number;
}
