/**
 * Tipos de los KPIs del dashboard admin (M1). Cada card en
 * `components/admin/kpis/` hace su propio `fetch('/api/admin/kpis/...')`
 * directo al proxy Next.js — este archivo solo define las formas de
 * respuesta que esas cards importan como `import type {...}`.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface ActiveLoansKpi {
  count: number;
  total_principal: number;
}

export interface CapitalKpi {
  total_capital: number;
  deployed: number;
  available: number;
  utilization_rate: number;
}

export interface NplByTermDays {
  term_days: number;
  total_loans: number;
  overdue_loans: number;
  total_principal: number;
  overdue_principal: number;
  npl_rate: number;
}

/** R4 — NPL general + por plazo, ambos en soles. GET /npl?termDays=7,15,30 */
export interface NplKpi {
  general_rate: number;
  overdue_capital: number;
  active_capital: number;
  by_term_days: NplByTermDays[];
}

export interface MoraStage {
  stage_key: string;
  label: string;
  min_days: number;
  max_days: number | null;
  installment_count: number;
  installment_amount: number;
  percentage: number;
}

/**
 * R5 — cuotas OVERDUE agrupadas por etapa de cobranza (a nivel de cuota, no de
 * préstamo). GET /npl/tranches. Caso de uso independiente de R4 (NplKpi) — el
 * porcentaje de cada etapa es sobre el total de cuotas en mora, no sobre la
 * cartera activa. Las 7 etapas siempre suman 100%.
 */
export interface NplTranchesKpi {
  total_overdue_installments: number;
  total_overdue_amount: number;
  stages: MoraStage[];
}

export interface IncomeKpi {
  accumulated_income: number;
  income_today: number;
  days_period: number;
}

export interface NpsKpi {
  total_responses: number;
  promoters: number;
  passives: number;
  detractors: number;
  nps_score: number;
}

export interface NpsKpiWithTrend {
  total_responses: number;
  promoters: number;
  passives: number;
  detractors: number;
  nps_score: number;
  year: number;
  month: number;
  month_label: string;
  prev_nps_score: number | null;
  prev_total_responses: number | null;
  trend_delta: number | null;
}

export interface FunnelKpi {
  new_intentions: number;
  applications_submitted: number;
  applications_pre_approved: number;
  credits_disbursed: number;
  overall_conversion_rate: number;
}

export interface ActiveClientsKpi {
  count: number;
  days_period: number;
}

export interface RepurchaseRateKpi {
  repeat_clients: number;
  active_clients: number;
  rate: number;
}

export interface CityEntry {
  city: string;
  loan_count: number;
  percentage: number;
}

export interface CityDistributionKpi {
  cities: CityEntry[];
}
