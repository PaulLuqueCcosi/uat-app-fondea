/**
 * Borrador y validación de la matriz de mora (tramos x conceptos).
 * Lógica pura, sin React: la usan el editor y el simulador.
 */

import {
  DEFAULT_ALLOCATION_ORDER,
  MATRIX_CONCEPTS,
  conceptLabel,
  methodLabel,
  valueUnit,
  type ChargeConcept,
  type ChargeMethod,
} from '@/modules/shared/charge-concepts';
import type {
  ConceptMethodSpec,
  ConceptsCatalog,
  PenaltyConfigResponse,
  PenaltyRule,
  PenaltyStage,
  SavePenaltyConfigRequest,
} from '@/modules/admin/admin-penalty.types';
import { findMethodSpec, ruleSummary } from '@/modules/shared/penalty-rule-text';

export interface CellDraft {
  /** `''` = el concepto no se cobra en este tramo (no se envía regla). */
  method: ChargeMethod | '';
  /** Texto del input, para no pelear con el cursor al escribir decimales. */
  value: string;
}

export interface StageDraft {
  key: string;
  fromDay: number;
  toDay: number | null;
  label: string;
  color: string;
  icon: string;
  cells: Partial<Record<ChargeConcept, CellDraft>>;
}

export interface MatrixDraft {
  stages: StageDraft[];
  allocationOrder: ChargeConcept[];
  /** Calcular la mora sobre el monto de la cuota con IGV. */
  includeIgv: boolean;
}

export interface MatrixError {
  stageIndex: number;
  concept?: ChargeConcept;
  message: string;
}

const MAX_LABEL_LENGTH = 100;
let stageCounter = 0;

function nextKey(): string {
  stageCounter += 1;
  return `stage-${stageCounter}`;
}

// ── Catálogo ──────────────────────────────────────────────────────────────────

// `findMethodSpec` y `ruleSummary` viven en `modules/shared/penalty-rule-text` (los usa también la vista del cliente).
export { findMethodSpec, ruleSummary };

/** Máximo efectivo de un método: para la TNA también cuenta el tope global del backend. */
export function effectiveMax(spec: ConceptMethodSpec, catalog: ConceptsCatalog | null): number {
  if (spec.valueKind === 'TNA' && catalog?.maxTnaPercent != null) {
    return Math.min(spec.max, catalog.maxTnaPercent);
  }
  return spec.max;
}

// ── Construcción del borrador ─────────────────────────────────────────────────

export function normalizeAllocationOrder(order: readonly ChargeConcept[] | undefined): ChargeConcept[] {
  const result: ChargeConcept[] = [];
  for (const concept of [...(order ?? []), ...DEFAULT_ALLOCATION_ORDER]) {
    if (!result.includes(concept)) result.push(concept);
  }
  return result;
}

function emptyStage(fromDay: number, toDay: number | null): StageDraft {
  return { key: nextKey(), fromDay, toDay, label: '', color: '#f59e0b', icon: 'clock', cells: {} };
}

/** Un solo tramo abierto. El interés compensatorio sigue corriendo si el catálogo lo permite. */
export function defaultMatrixDraft(catalog: ConceptsCatalog | null): MatrixDraft {
  const stage = emptyStage(1, null);
  stage.label = 'Mora';
  if (findMethodSpec(catalog, 'INTERES_COMPENSATORIO', 'SIGUE_CORRIENDO')) {
    stage.cells.INTERES_COMPENSATORIO = { method: 'SIGUE_CORRIENDO', value: '100' };
  }
  return { stages: [stage], allocationOrder: normalizeAllocationOrder(undefined), includeIgv: false };
}

function cellsFromRules(rules: PenaltyRule[]): Partial<Record<ChargeConcept, CellDraft>> {
  const cells: Partial<Record<ChargeConcept, CellDraft>> = {};
  for (const rule of rules) {
    cells[rule.concept] = { method: rule.method, value: String(rule.value) };
  }
  return cells;
}

/** Toma una configuración guardada como punto de partida de una versión nueva. */
export function draftFromConfig(config: PenaltyConfigResponse | null, catalog: ConceptsCatalog | null): MatrixDraft {
  if (!config || config.stages.length === 0) {
    return defaultMatrixDraft(catalog);
  }
  const stages: StageDraft[] = config.stages.map((s) => ({
    key: nextKey(),
    fromDay: s.fromDay,
    toDay: s.toDay,
    label: s.label ?? '',
    color: s.color ?? '#f59e0b',
    icon: s.icon ?? 'clock',
    cells: cellsFromRules(s.rules),
  }));
  return {
    stages: makeConsecutive(stages),
    allocationOrder: normalizeAllocationOrder(config.allocationOrder),
    includeIgv: config.includeIgv,
  };
}

// ── Edición de tramos (siempre consecutivos, el último abierto) ───────────────

/** El primer tramo empieza en 1, cada uno empieza donde termina el anterior y solo el último queda abierto. */
export function makeConsecutive(stages: StageDraft[]): StageDraft[] {
  return stages.map((stage, i) => ({
    ...stage,
    fromDay: i === 0 ? 1 : (stages[i - 1].toDay ?? stages[i - 1].fromDay) + 1,
    toDay: i === stages.length - 1 ? null : stage.toDay,
  }));
}

export function addStage(stages: StageDraft[]): StageDraft[] {
  const last = stages[stages.length - 1];
  if (!last) return [emptyStage(1, null)];
  const closed = { ...last, toDay: last.fromDay + 9 };
  const created: StageDraft = {
    ...emptyStage(closed.toDay + 1, null),
    color: '#ef4444',
    icon: 'alert-triangle',
    // El tramo nuevo parte de las mismas reglas del anterior; el admin las ajusta.
    cells: Object.fromEntries(Object.entries(last.cells).map(([k, v]) => [k, { ...v }])),
  };
  return makeConsecutive([...stages.slice(0, -1), closed, created]);
}

export function removeStage(stages: StageDraft[], index: number): StageDraft[] {
  if (stages.length <= 1) return stages;
  return makeConsecutive(stages.filter((_, i) => i !== index));
}

export function setStageToDay(stages: StageDraft[], index: number, toDay: number | null): StageDraft[] {
  return makeConsecutive(stages.map((s, i) => (i === index ? { ...s, toDay } : s)));
}

// ── Validación del lado del cliente ───────────────────────────────────────────

/**
 * Valida el borrador contra las reglas de conceptos y métodos que trae el backend.
 */
export function validateMatrix(
  draft: MatrixDraft,
  catalog: ConceptsCatalog | null,
): MatrixError[] {
  const errors: MatrixError[] = [];
  if (!catalog) {
    return [{ stageIndex: 0, message: 'No se pudieron cargar las reglas de los conceptos. Recarga la página.' }];
  }
  if (draft.stages.length === 0) {
    return [{ stageIndex: 0, message: 'Agrega al menos un tramo' }];
  }

  draft.stages.forEach((stage, i) => {
    const isLast = i === draft.stages.length - 1;
    if (stage.label.length > MAX_LABEL_LENGTH) {
      errors.push({ stageIndex: i, message: `La etiqueta no puede pasar de ${MAX_LABEL_LENGTH} caracteres` });
    }
    if (!isLast && stage.toDay === null) {
      errors.push({ stageIndex: i, message: 'Solo el último tramo puede quedar abierto' });
    }
    if (stage.toDay !== null && stage.toDay < stage.fromDay) {
      errors.push({ stageIndex: i, message: `"Hasta día" debe ser mayor o igual a ${stage.fromDay}` });
    }

    let rules = 0;
    for (const concept of MATRIX_CONCEPTS) {
      const cell = stage.cells[concept];
      if (!cell || cell.method === '') continue;
      rules += 1;
      const spec = findMethodSpec(catalog, concept, cell.method);
      if (!spec) {
        errors.push({
          stageIndex: i,
          concept,
          message: `${methodLabel(cell.method)} no está permitido para ${conceptLabel(concept)}`,
        });
        continue;
      }
      const raw = cell.value.trim();
      const value = Number(raw);
      if (raw === '' || !Number.isFinite(value)) {
        errors.push({ stageIndex: i, concept, message: `${conceptLabel(concept)}: ingresa un valor` });
        continue;
      }
      const max = effectiveMax(spec, catalog);
      if (value < spec.min || value > max) {
        errors.push({
          stageIndex: i,
          concept,
          message: `${conceptLabel(concept)}: el valor debe estar entre ${spec.min} y ${max} ${valueUnit(spec.valueKind)}`.trim(),
        });
      }
    }
    if (rules === 0) {
      errors.push({ stageIndex: i, message: 'El tramo necesita al menos un concepto con regla' });
    }
  });

  return errors;
}

// ── Conversión a la petición del backend ──────────────────────────────────────

export function stagesFromDraft(draft: MatrixDraft): PenaltyStage[] {
  return draft.stages.map((stage) => {
    const rules: PenaltyRule[] = [];
    for (const concept of MATRIX_CONCEPTS) {
      const cell = stage.cells[concept];
      if (!cell || cell.method === '') continue;
      rules.push({ concept, method: cell.method, value: Number(cell.value) });
    }
    return {
      fromDay: stage.fromDay,
      toDay: stage.toDay,
      label: stage.label.trim() || null,
      color: stage.color || null,
      icon: stage.icon || null,
      rules,
    };
  });
}

export function requestFromDraft(
  name: string,
  draft: MatrixDraft,
): SavePenaltyConfigRequest {
  return {
    name,
    stages: stagesFromDraft(draft),
    allocationOrder: draft.allocationOrder,
    includeIgv: draft.includeIgv,
  };
}
