/**
 * Tipos del módulo de configuración de scorecard (admin).
 */

// ─── Config ──────────────────────────────────────────────────────────────────

export type ConfigStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface ScorecardConfig {
  id: string;
  version: number;
  name: string;
  description: string | null;
  status: ConfigStatus;
  maxScore: number;
  dimensions: DimensionConfig[];
  createdBy: string | null;
  activatedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
}

export interface DimensionConfig {
  code: string;
  name: string;
  maxPoints: number;
  rules: RuleConfig[];
}

export type RuleType = 'RANGES' | 'BOOLEAN' | 'ENUM_MAP';

export interface RuleConfig {
  code: string;
  name: string;
  inputField: string;
  type: RuleType;
  maxPoints: number;
  ranges: RangeEntry[] | null;
  truePoints: number | null;
  falsePoints: number | null;
  enumMap: Record<string, number> | null;
  defaultPoints: number | null;
}

export interface RangeEntry {
  operator: string;
  value: number | null;
  points: number;
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export interface ScorecardMetadata {
  availableFields: AvailableField[];
  ruleTypes: string[];
  operators: OperatorInfo[];
  scoreLevels: string[];
}

export interface AvailableField {
  code: string;
  name: string;
  description: string;
  category: string;
  dataType: 'NUMBER' | 'BOOLEAN' | 'ENUM';
  enumValues: EnumOption[] | null;
  unit: string | null;
  minValue: number | null;
  maxValue: number | null;
}

export interface EnumOption {
  value: string;
  label: string;
}

export interface OperatorInfo {
  code: string;
  symbol: string;
  description: string;
}

// ─── Evaluation ──────────────────────────────────────────────────────────────

export interface EvaluationOutcome {
  success: boolean;
  evaluationId: string | null;
  userId: string;
  newScore: number | null;
  previousScore: number | null;
  delta: number | null;
  scoreLevel: string | null;
  trigger: string;
  configVersion: number | null;
  calculatedAt: string;
  errorMessage: string | null;
}

export interface EvaluationRecord {
  id: string;
  userId: string;
  configId: string;
  configVersion: number;
  trigger: string;
  triggerReferenceId: string | null;
  totalScore: number;
  previousScore: number | null;
  inputSnapshot: string;
  dimensions: DimensionResult[];
  createdAt: string;
}

export interface DimensionResult {
  code: string;
  name: string;
  maxPoints: number;
  obtainedPoints: number;
  rawPoints: number;
  rules: RuleResult[];
}

export interface RuleResult {
  code: string;
  name: string;
  inputField: string;
  inputValue: string;
  maxPoints: number;
  obtainedPoints: number;
  matchedCondition: string;
  reason: string;
}
