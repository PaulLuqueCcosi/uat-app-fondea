/**
 * Tipos para la sección de Transparencia.
 *
 * Define las consecuencias de mora según el producto.
 * Puede variar por producto — el backend envía la configuración adecuada.
 */

// ── Severidad de un escenario ─────────────────────────────────────────────────

/** Nivel de gravedad — el frontend elige color/icono según esto */
export type ScenarioSeverity = 'positive' | 'low' | 'medium' | 'high' | 'critical';

// ── Escenario individual ──────────────────────────────────────────────────────

export interface TransparencyScenario {
  /** ID único del escenario */
  id: string;
  /** Día de inicio del rango (inclusive). 0 = pago puntual */
  fromDay: number;
  /** Día fin del rango (inclusive). null = sin tope (ej: 15+) */
  toDay: number | null;
  /** Título corto (ej: "Puntual", "1-3 días") */
  title: string;
  /** Consecuencia principal (ej: "Penalidad de S/ 5 por día") */
  description: string;
  /** Severidad para que el frontend decida la UI */
  severity: ScenarioSeverity;
  /** Monto de penalidad por día en este rango (null si no aplica, ej: puntual) */
  penaltyPerDay: number | null;
}

// ── Configuración completa de transparencia ───────────────────────────────────


export interface TransparencyConfig {
  /** ID del producto al que aplica esta configuración */
  productId: string;
  /** Moneda (ISO 4217) */
  currency: string;
  /** Escenarios ordenados de menor a mayor gravedad */
  scenarios: TransparencyScenario[];
  /** Mensaje/tip positivo que se muestra al final */
  tip: string;
}
