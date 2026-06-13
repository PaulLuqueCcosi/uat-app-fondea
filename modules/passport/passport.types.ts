/**
 * Tipos del dominio Pasaporte Financiero.
 *
 * Describe lo que el frontend necesita para renderizar:
 * - Niveles con su configuración visual (colores personalizables desde backend)
 * - Resumen del usuario (nivel actual, puntos, progreso)
 * - Historial de movimientos de puntos
 */

// ── Nivel ─────────────────────────────────────────────────────────────────────

export interface PassportLevel {
  /** Nombre visible del nivel (ej: "Bronce", "Plata") */
  name: string;
  /** Puntos mínimos para acceder a este nivel */
  minPoints: number;
  /** Monto máximo de préstamo en este nivel */
  maxAmount: number;
  /** Clase Tailwind para el color de texto (viene del servicio) */
  color: string;
  /** Clase Tailwind para el fondo (viene del servicio) */
  bgColor: string;
  /** Clase Tailwind para el borde (viene del servicio) */
  borderColor: string;
  /** Ruta de la imagen del nivel */
  image: string;
}

// ── Resumen ───────────────────────────────────────────────────────────────────

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
