/**
 * Tipos del dominio Pasaporte Financiero.
 *
 * Cada nivel tiene un rango de puntos (min-max) y un límite de crédito.
 * Los metadatos visuales (colores, imagen) son configurables desde el servicio.
 */

// ── Nivel ─────────────────────────────────────────────────────────────────────

/** Metadatos visuales del nivel — configurables, no son lógica de negocio */
export interface PassportLevelMeta {
  /** Clase Tailwind para el color de texto */
  color: string;
  /** Clase Tailwind para el fondo */
  bgColor: string;
  /** Clase Tailwind para el borde */
  borderColor: string;
  /** Ruta de la imagen/mascota del sello */
  image: string;
}

/** Un nivel/rango del pasaporte financiero */
export interface PassportLevel {
  /** Nombre del nivel (ej: "Bronce") */
  name: string;
  /** Puntos mínimos para entrar en este rango (inclusive) */
  minPoints: number;
  /** Puntos máximos de este rango (inclusive). null = sin tope (último nivel) */
  maxPoints: number | null;
  /** Monto máximo de crédito habilitado en este nivel */
  maxLoanAmount: number;
  /** Código de moneda ISO 4217 (ej: "PEN") */
  currency: string;
  /** Metadatos visuales (colores, imagen) */
  meta: PassportLevelMeta;
}

// ── Resumen del usuario ───────────────────────────────────────────────────────

export interface PassportSummary {
  /** Índice del nivel actual del usuario (0-based) */
  currentLevelIndex: number;
  /** Puntos totales acumulados */
  points: number;
  /** Todos los niveles disponibles en orden ascendente */
  levels: PassportLevel[];
}

// ── Historial ─────────────────────────────────────────────────────────────────

export type PointsMovementType = 'EARNED' | 'REDEEMED';

export interface PointsHistoryEntry {
  id: string;
  description: string;
  points: number;
  date: string;
  type: PointsMovementType;
}
