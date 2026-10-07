/**
 * Etiquetas en español de los códigos de fallo/rechazo de una solicitud (`failure_code`).
 *
 * El código INSUFFICIENT_FUNDS se distingue a propósito de los rechazos por reglas: es un rechazo
 * del lado de Fondea (no hay fondo para el monto), no una decisión sobre el perfil del usuario, y el
 * admin necesita poder separarlos para decidir cuánto fondo falta.
 */
export const FAILURE_CODE_LABELS: Record<string, string> = {
  BUSINESS_VALIDATION_FAILED: 'Reglas de evaluación',
  SCORE_CALCULATION_FAILED: 'Error al calcular el score',
  CALCULATION_ERROR: 'Error al calcular el préstamo',
  EVALUATION_ERROR: 'Error técnico en la evaluación',
  INSUFFICIENT_FUNDS: 'Sin fondo disponible',
};

/** Etiqueta legible del código; si es uno que el front no conoce todavía, devuelve el código tal cual. */
export function failureCodeLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  return FAILURE_CODE_LABELS[code] ?? code;
}

/** Opciones del filtro "motivo de rechazo" del listado (solo los códigos que producen un REJECTED). */
export const REJECTION_REASON_FILTER_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'INSUFFICIENT_FUNDS', label: 'Rechazo: sin fondo disponible' },
  { value: 'BUSINESS_VALIDATION_FAILED', label: 'Rechazo: reglas de evaluación' },
];
