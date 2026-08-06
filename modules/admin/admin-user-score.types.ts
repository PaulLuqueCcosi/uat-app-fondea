/**
 * Tipos para el score crediticio interno (0-1000) y el reporte de buró
 * de un usuario — vista admin. Distinto del "puntaje" de fidelización
 * (ver admin-user-puntaje.types.ts) — son dominios distintos.
 *
 * Mapea la respuesta del backend de:
 * - GET  /api/v1/admin/scoring/evaluations/{userId}
 * - POST /api/v1/admin/scoring/recalculate/{userId}
 * - GET  /api/v1/admin/buro/{userId}
 * - POST /api/v1/admin/buro/{userId}/consult
 */

export type ScoreTriggerType =
  | 'APPLICATION_APPROVED'
  | 'CREDIT_DISBURSED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_OVERDUE'
  | 'BURO_UPDATED'
  | 'ADMIN_REQUEST'
  | 'PROFILE_UPDATED'
  | 'SCHEDULED';

// El módulo scoring/evaluation serializa en camelCase plano (sin @JsonProperty) —
// no hace falta mapper backend→frontend acá, a diferencia de buró (snake_case).

/** Resultado de UNA regla dentro de una evaluación (auditoría completa). */
export interface RuleResult {
  code: string;
  name: string;
  inputField: string;
  inputValue: string;
  maxPoints: number;
  obtainedPoints: number;
  matchedCondition: string;
  /** Texto ya formateado por el backend, ej: "expenseRatio=0.42, matched <0.50 → 70pts" */
  reason: string;
}

/** Resultado de UNA dimensión (agrupa el resultado de todas sus reglas). */
export interface DimensionResult {
  code: string;
  name: string;
  maxPoints: number;
  obtainedPoints: number;
  /** Suma cruda antes de capear a maxPoints — puede exceder maxPoints. */
  rawPoints: number;
  rules: RuleResult[];
}

export interface ScoreEvaluation {
  id: string;
  userId: string;
  configId: string;
  configVersion: number;
  trigger: ScoreTriggerType;
  triggerReferenceId: string | null;
  totalScore: number;
  previousScore: number | null;
  /** JSON con el snapshot de TODOS los datos de entrada usados en este cálculo. */
  inputSnapshot: string;
  dimensions: DimensionResult[];
  createdAt: string;
  /** Derivados por el backend (EvaluationRecord.getScoreDelta()/getScoreLevel()) */
  scoreDelta: number;
  scoreLevel: string;
}

export interface ScoreRecalculateResult {
  success: boolean;
  evaluationId: string | null;
  newScore: number | null;
  previousScore: number | null;
  delta: number | null;
  scoreLevel: string | null;
  configVersion: number | null;
  calculatedAt: string;
  errorMessage: string | null;
}

// ── Buró — backend usa snake_case (@JsonProperty explícito) ───────────────────

export interface BuroDebtBackend {
  entity_name: string;
  credit_type: string;
  original_amount: number;
  outstanding_amount: number;
  days_overdue: number;
  classification: string;
  reported_at: string;
}

export interface BuroReportBackend {
  id: string;
  buro_score: number | null;
  worst_classification: string | null;
  total_debts_count: number;
  total_debt_amount: number;
  overdue_debts_count: number;
  overdue_debt_amount: number;
  entities_count: number;
  protests_count: number;
  inquiries_count: number;
  provider: string;
  consulted_at: string;
  expires_at: string;
  is_valid: boolean;
  debts: BuroDebtBackend[];
}

export interface BuroDebt {
  entityName: string;
  creditType: string;
  originalAmount: number;
  outstandingAmount: number;
  daysOverdue: number;
  classification: string;
  reportedAt: string;
}

export interface BuroReport {
  id: string;
  buroScore: number | null;
  worstClassification: string | null;
  totalDebtsCount: number;
  totalDebtAmount: number;
  overdueDebtsCount: number;
  overdueDebtAmount: number;
  entitiesCount: number;
  protestsCount: number;
  inquiriesCount: number;
  provider: string;
  consultedAt: string;
  expiresAt: string;
  isValid: boolean;
  debts: BuroDebt[];
}

export interface ConsultBuroResult {
  ok: boolean;
  report: BuroReport | null;
  message?: string;
}

export interface BuroHistoryEntryBackend {
  id: string;
  buro_score: number | null;
  worst_classification: string | null;
  total_debt_amount: number;
  provider: string;
  consulted_at: string;
  is_valid: boolean;
}

export interface BuroHistoryEntry {
  id: string;
  buroScore: number | null;
  worstClassification: string | null;
  totalDebtAmount: number;
  provider: string;
  consultedAt: string;
  isValid: boolean;
}
