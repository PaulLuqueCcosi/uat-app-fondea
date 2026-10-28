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
export function ruleSummary(rule: PenaltyRule | undefined, catalog: ConceptsCatalog | null): string {
  if (!rule) return 'No se cobra';
  const kind = findMethodSpec(catalog, rule.concept, rule.method)?.valueKind ?? inferKind(rule.method);
  const unit = valueUnit(kind);
  const value = unit === 'S/' ? `S/ ${rule.value}` : `${rule.value} ${unit}`;
  return `${methodLabel(rule.method)}: ${value}`;
}

/** Respaldo para mostrar valores cuando el catálogo no está disponible (solo lectura). */
function inferKind(method: ChargeMethod): 'PERCENT' | 'TNA' | 'AMOUNT' {
  if (method === 'TASA_NOMINAL_ANUAL_SOBRE_CAPITAL') return 'TNA';
  if (method === 'MONTO_FIJO_UNA_VEZ' || method === 'MONTO_FIJO_DIARIO') return 'AMOUNT';
  return 'PERCENT';
}

/** Una línea por regla del tramo, en el orden de la matriz: "Interés moratorio: TNA sobre capital vencido: 24 % anual". */
export function stageRuleLines(rules: PenaltyRule[]): string[] {
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
