import { formatCurrency } from '@/lib/admin-formatters';

/**
 * Conceptos de cobro de la mora y de las comisiones del catálogo de la calculadora.
 * Fuente única de los textos en español: la usan la pantalla de configuración de mora,
 * el catálogo de comisiones y, más adelante, las vistas de crédito.
 *
 * Las reglas (qué métodos admite cada concepto y sus límites) NO viven aquí: las entrega
 * `GET /api/v1/admin/penalty-config/concepts`. Aquí solo hay textos de respaldo.
 */

/** Categorías estables del backend (`ChargeConcept`). */
export type ChargeConcept =
  | 'INTERES_COMPENSATORIO'
  | 'GASTOS'
  | 'TARIFA'
  | 'INTERES_MORATORIO'
  | 'MORA_SIMPLE';

/** Métodos de cálculo de una regla (`ChargeMethod`). */
export type ChargeMethod =
  | 'SIGUE_CORRIENDO'
  | 'UNA_VEZ'
  | 'TASA_NOMINAL_ANUAL_SOBRE_CAPITAL'
  | 'MONTO_FIJO_UNA_VEZ'
  | 'MONTO_FIJO_DIARIO';

/** Cómo se interpreta el valor de un método. */
export type ChargeValueKind = 'PERCENT' | 'TNA' | 'AMOUNT';

/** Columnas de la matriz de mora, en el orden en que se muestran. */
export const MATRIX_CONCEPTS: readonly ChargeConcept[] = [
  'INTERES_COMPENSATORIO',
  'GASTOS',
  'TARIFA',
  'INTERES_MORATORIO',
];

/** Categorías que puede tener una comisión del catálogo de la calculadora. */
export const FEE_CATEGORIES: readonly ChargeConcept[] = [
  'INTERES_COMPENSATORIO',
  'GASTOS',
  'TARIFA',
];

/** Orden de imputación por defecto del backend. */
export const DEFAULT_ALLOCATION_ORDER: readonly ChargeConcept[] = [
  'GASTOS',
  'TARIFA',
  'INTERES_MORATORIO',
  'INTERES_COMPENSATORIO',
  'MORA_SIMPLE',
];

const CONCEPT_LABELS: Record<ChargeConcept, string> = {
  INTERES_COMPENSATORIO: 'Interés compensatorio',
  GASTOS: 'Gastos',
  TARIFA: 'Tarifa',
  INTERES_MORATORIO: 'Interés moratorio',
  MORA_SIMPLE: 'Mora (sistema anterior)',
};

const CONCEPT_HELP: Record<ChargeConcept, string> = {
  INTERES_COMPENSATORIO: 'El interés pactado de la cuota; sigue corriendo mientras el cliente está en mora.',
  GASTOS: 'Cargos por servicios de terceros o recuperación de costos (por ejemplo, cargo administrativo o tecnológico).',
  TARIFA: 'Cargo fijo en soles por un servicio o evento concreto del tarifario.',
  INTERES_MORATORIO: 'Indemniza el atraso. Se calcula como tasa nominal anual sobre el capital vencido de la cuota.',
  MORA_SIMPLE: 'Cargo único del sistema anterior (rangos con monto fijo o porcentaje).',
};

const METHOD_LABELS: Record<ChargeMethod, string> = {
  SIGUE_CORRIENDO: 'Sigue corriendo (% por día)',
  UNA_VEZ: 'Una sola vez (%)',
  TASA_NOMINAL_ANUAL_SOBRE_CAPITAL: 'TNA sobre capital vencido',
  MONTO_FIJO_UNA_VEZ: 'Monto fijo, una sola vez',
  MONTO_FIJO_DIARIO: 'Monto fijo por día',
};

const VALUE_UNITS: Record<ChargeValueKind, string> = {
  PERCENT: '%',
  TNA: '% anual',
  AMOUNT: 'S/',
};

/** Nombre en español de un concepto; si el backend manda uno nuevo, usa el texto que traiga. */
export function conceptLabel(code: string, backendLabel?: string | null): string {
  if (backendLabel && backendLabel.trim()) return backendLabel;
  return CONCEPT_LABELS[code as ChargeConcept] ?? code;
}

export function conceptHelp(code: string): string {
  return CONCEPT_HELP[code as ChargeConcept] ?? '';
}

export function methodLabel(method: string): string {
  return METHOD_LABELS[method as ChargeMethod] ?? method;
}

export function valueUnit(kind: ChargeValueKind | string): string {
  return VALUE_UNITS[kind as ChargeValueKind] ?? '';
}

/** Tipo de valor de un método según su nombre (respaldo cuando el backend no lo manda). */
export function valueKindForMethod(method: string): ChargeValueKind {
  if (method === 'TASA_NOMINAL_ANUAL_SOBRE_CAPITAL') return 'TNA';
  if (method === 'MONTO_FIJO_UNA_VEZ' || method === 'MONTO_FIJO_DIARIO') return 'AMOUNT';
  return 'PERCENT';
}

/** Valor de una regla con su unidad: "2.5%", "24% anual" o un monto con el formato de montos admin. */
export function ruleValueText(method: string, value: number): string {
  const kind = valueKindForMethod(method);
  if (kind === 'AMOUNT') return formatCurrency(value);
  return `${value}${kind === 'TNA' ? '% anual' : '%'}`;
}

/** Opciones para el selector de categoría de una comisión del catálogo. */
export const FEE_CATEGORY_OPTIONS: ReadonlyArray<{ value: ChargeConcept; label: string }> =
  FEE_CATEGORIES.map((value) => ({ value, label: CONCEPT_LABELS[value] }));

/** Nombre de la categoría de una comisión; `null` cuando el catálogo aún no la trae (datos viejos). */
export function feeCategoryLabel(category: string | null | undefined): string | null {
  if (!category) return null;
  return CONCEPT_LABELS[category as ChargeConcept] ?? category;
}
