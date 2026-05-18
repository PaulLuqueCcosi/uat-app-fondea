/**
 * Constantes del LoanCalculator
 * Valores de layout y configuración del gauge
 */

// ── Valores del gauge para cada perfil (bajo, medio, alto) ────────────────────
export const GAUGE_VALUES = [0.05, 0.50, 0.95] as const;

// ── Anchos máximos de los paneles (px) ───────────────────────────────────────
/** Ancho máximo de la tarjeta principal */
export const CARD_MAX_WIDTH = 400;
/** Ancho máximo del panel de detalle */
export const DETAIL_MAX_WIDTH = 400;
/** Gap entre tarjeta y detalle */
export const DETAIL_GAP = 16;
/** Ancho mínimo del contenedor para mostrar sidebar (calculado) */
export const DETAIL_SIDEBAR_BREAKPOINT = CARD_MAX_WIDTH + DETAIL_GAP + DETAIL_MAX_WIDTH;
