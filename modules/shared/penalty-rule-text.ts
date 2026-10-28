/**
 * Textos en español de las reglas de mora guardadas. Los usan la configuración del admin,
 * el detalle del crédito y la vista del cliente. Lógica pura, sin React.
 */

import {
  MATRIX_CONCEPTS,
  conceptLabel,
  methodLabel,
  valueUnit,
  type ChargeConcept,
  type ChargeMethod,
} from '@/modules/shared/charge-concepts';
import type { ConceptMethodSpec, ConceptsCatalog, PenaltyRule } from '@/modules/admin/admin-penalty.types';

export function findMethodSpec(
  catalog: ConceptsCatalog | null,
  concept: ChargeConcept,
  method: ChargeMethod | '',
): ConceptMethodSpec | undefined {
  if (!catalog || !method) return undefined;
  return catalog.concepts
    .find((c) => c.code === concept)
    ?.allowedMethods.find((m) => m.method === method);
}

/** "Sigue corriendo · 100 %" o "No se cobra", para la vista de solo lectura. */
/** Rule as stored; `method` is a plain string when it comes from a credit's frozen config. */
export type RuleLike = Pick<PenaltyRule, 'concept' | 'value'> & { method: string };

export function ruleSummary(rule: RuleLike | undefined, catalog: ConceptsCatalog | null): string {
  if (!rule) return 'No se cobra';
  const kind = findMethodSpec(catalog, rule.concept, rule.method as ChargeMethod)?.valueKind ?? inferKind(rule.method);
  const unit = valueUnit(kind);
  const value = unit === 'S/' ? `S/ ${rule.value}` : `${rule.value} ${unit}`;
  return `${methodLabel(rule.method)}: ${value}`;
}

/** Respaldo para mostrar valores cuando el catálogo no está disponible (solo lectura). */
function inferKind(method: string): 'PERCENT' | 'TNA' | 'AMOUNT' {
  if (method === 'TASA_NOMINAL_ANUAL_SOBRE_CAPITAL') return 'TNA';
  if (method === 'MONTO_FIJO_UNA_VEZ' || method === 'MONTO_FIJO_DIARIO') return 'AMOUNT';
  return 'PERCENT';
}

/** Una línea por regla del tramo, en el orden de la matriz: "Interés moratorio: TNA sobre capital vencido: 24 % anual". */
export function stageRuleLines(rules: RuleLike[]): string[] {
  const position = (concept: ChargeConcept) => {
    const i = MATRIX_CONCEPTS.indexOf(concept);
    return i === -1 ? MATRIX_CONCEPTS.length : i;
  };
  return [...rules]
    .sort((a, b) => position(a.concept) - position(b.concept))
    .map((rule) => `${conceptLabel(rule.concept)}: ${ruleSummary(rule, null)}`);
}

/** "Días 1 a 3" o "Día 4 en adelante" (tramo abierto). */
export function stageDaysText(fromDay: number, toDay: number | null): string {
  if (toDay === null) return `Día ${fromDay} en adelante`;
  if (fromDay === toDay) return `Día ${fromDay}`;
  return `Días ${fromDay} a ${toDay}`;
}

/** Minimal stage shape needed to locate a day inside a penalty config. */
export interface DayRangeStage {
  fromDay: number;
  /** null = open-ended stage. */
  toDay: number | null;
}

/** The stage that contains the given day of delay, or null when none does (e.g. day 0). */
export function stageForDay<T extends DayRangeStage>(stages: readonly T[], day: number): T | null {
  if (day <= 0) return null;
  return stages.find((s) => day >= s.fromDay && (s.toDay === null || day <= s.toDay)) ?? null;
}

/** The first stage that starts after the given day, or null when the current one is the last. */
export function nextStageAfterDay<T extends DayRangeStage>(stages: readonly T[], day: number): T | null {
  const upcoming = stages.filter((s) => s.fromDay > day).sort((a, b) => a.fromDay - b.fromDay);
  return upcoming[0] ?? null;
}

/** Days left until the next stage starts (at least 1), or null when there is no next stage. */
export function daysUntilNextStage<T extends DayRangeStage>(stages: readonly T[], day: number): number | null {
  const next = nextStageAfterDay(stages, day);
  return next ? Math.max(1, next.fromDay - day) : null;
}

/** "Tramo 1" style short label: the configured label, or the day range when the stage has none. */
export function stageShortLabel(stage: DayRangeStage & { label?: string | null }): string {
  return stage.label?.trim() || stageDaysText(stage.fromDay, stage.toDay);
}

/** "1 día" / "20 días". */
export function daysText(n: number): string {
  return `${n} ${n === 1 ? 'día' : 'días'}`;
}
