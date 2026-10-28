/**
 * Tipos de la configuración de mora (admin).
 *
 * Contrato del backend: `/api/v1/admin/penalty-config` (spec S3/S4 de "mora por conceptos").
 * Supuestos escritos aquí para que no se pierdan:
 *  - Una respuesta sin `stages` es una lista vacía; sin `allocationOrder`, el orden por defecto.
 *  - Los errores del backend traen `code` (estable) y `message`; si no hay `code` se usa `message`.
 */

import type {
  ChargeConcept,
  ChargeMethod,
  ChargeValueKind,
} from '@/modules/shared/charge-concepts';

// ── Configuración (mora por conceptos) ────────────────────────────────────────

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
  stages: PenaltyStage[];
  allocationOrder: ChargeConcept[];
  /** La mora se calcula sobre el monto de la cuota con IGV; una respuesta sin el campo es `false`. */
  includeIgv: boolean;
}

export interface SavePenaltyConfigRequest {
  name: string;
  allocationOrder?: ChargeConcept[];
  stages?: PenaltyStage[];
  /** Calcular la mora sobre el monto con IGV; omitido = no. */
  includeIgv?: boolean;
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
  /** Código estable del backend (por ejemplo MORA_TNA_OUT_OF_RANGE), si lo hay. */
  code?: string;
  message: string;
  status?: number;
}

export type PenaltyResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: PenaltyMutationError };
