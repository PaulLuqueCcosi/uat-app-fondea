/**
 * Tipos de la configuración de mora (admin).
 *
 * Contrato del backend: `/api/v1/admin/penalty-config` (spec S3/S4 de "mora por conceptos").
 * Supuestos escritos aquí para que no se pierdan:
 *  - Una respuesta sin `mode` es una configuración anterior: se trata como SIMPLE.
 *  - Una respuesta sin `stages` es una lista vacía; sin `allocationOrder`, el orden por defecto.
 *  - Los errores del backend traen `code` (estable) y `message`; si no hay `code` se usa `message`.
 */

import type { PenaltyBase } from '@/modules/shared/penalty-base';
import type {
  ChargeConcept,
  ChargeMethod,
  ChargeValueKind,
} from '@/modules/shared/charge-concepts';

// ── Configuración (modo SIMPLE, igual que antes) ──────────────────────────────

export type PenaltyType = 'PERCENTAGE' | 'FIXED';
export type PenaltyMode = 'SIMPLE' | 'POR_CONCEPTOS';

export interface PenaltyRangeResponse {
  id: string;
  fromDay: number;
  toDay: number | null;
  type: PenaltyType;
  value: number;
  base: PenaltyBase | null;
  sortOrder: number;
  color: string | null;
  icon: string | null;
  label: string | null;
}

export interface SavePenaltyRangeRequest {
  fromDay: number;
  toDay: number | null;
  type: PenaltyType;
  value: number;
  base: PenaltyBase | null;
  color?: string | null;
  icon?: string | null;
  label?: string | null;
}

// ── Configuración (modo POR_CONCEPTOS) ────────────────────────────────────────

export interface PenaltyRule {
  concept: ChargeConcept;
  method: ChargeMethod;
  value: number;
}

export interface PenaltyStage {
  id?: string;
  fromDay: number;
  toDay: number | null;
  label: string | null;
  color: string | null;
  icon: string | null;
  rules: PenaltyRule[];
}

export interface PenaltyConfigResponse {
  id: string;
  name: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  mode: PenaltyMode;
  ranges: PenaltyRangeResponse[];
  stages: PenaltyStage[];
  allocationOrder: ChargeConcept[];
}

export interface SavePenaltyConfigRequest {
  name: string;
  /** Solo se envía en modo POR_CONCEPTOS; sin `mode` el backend asume SIMPLE. */
  mode?: PenaltyMode;
  /** Obligatorio solo en modo SIMPLE. */
  ranges?: SavePenaltyRangeRequest[];
  allocationOrder?: ChargeConcept[];
  stages?: PenaltyStage[];
}

// ── Catálogo de conceptos (GET /concepts) ─────────────────────────────────────

export interface ConceptMethodSpec {
  method: ChargeMethod;
  valueKind: ChargeValueKind;
  min: number;
  max: number;
}

export interface ConceptSpec {
  code: ChargeConcept;
  label: string;
  allowedMethods: ConceptMethodSpec[];
}

export interface ConceptsCatalog {
  concepts: ConceptSpec[];
  maxTnaPercent: number | null;
}

// ── Perfil de cumplimiento (GET/PUT /compliance) ──────────────────────────────

export type ComplianceProfile = 'REGULATED' | 'UNREGULATED';

export interface ComplianceHistoryEntry {
  profile: ComplianceProfile;
  reason: string;
  changedBy: string;
  changedAt: string;
}

export interface ComplianceState {
  profile: ComplianceProfile;
  history: ComplianceHistoryEntry[];
}

// ── Simulador (POST /simulate) ────────────────────────────────────────────────

export interface SimulatePenaltyRequest {
  /** Configuración sin guardar (misma forma que el POST de configuración). */
  config?: SavePenaltyConfigRequest;
  /** Configuración ya guardada. Se envía uno de los dos, `config` o `configId`. */
  configId?: string;
  conceptAmounts: Partial<Record<ChargeConcept, number>>;
  periodDays: number;
  overdueCapital: number;
  fromDay: number;
  toDay: number;
}

export type ConceptAmounts = Partial<Record<ChargeConcept, number>>;

export interface SimulatedDay {
  day: number;
  charges: ConceptAmounts;
}

export interface SimulatePenaltyResponse {
  perDay: SimulatedDay[];
  totals: ConceptAmounts;
}

// ── Resultado de las mutaciones ───────────────────────────────────────────────

export interface PenaltyMutationError {
  /** Código estable del backend (por ejemplo COMPLIANCE_FEES_ON_DELAY), si lo hay. */
  code?: string;
  message: string;
  status?: number;
}

export type PenaltyResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: PenaltyMutationError };
