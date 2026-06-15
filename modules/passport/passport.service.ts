/**
 * Service del Pasaporte Financiero — la ÚNICA puerta a los datos.
 *
 * Responsabilidades:
 * - Obtener resumen del pasaporte (nivel actual, puntos, niveles disponibles)
 * - Obtener historial de movimientos de puntos
 * - Calcular en qué nivel está el usuario según sus puntos
 *
 * HOY: retorna data mock.
 * MAÑANA: backendFetch al endpoint real + mappers.
 *
 * Retorna Result<T> — los consumidores nunca ven errores crudos.
 */

import type { Result } from '@/modules/shared/result';
import type { PassportSummary, PassportLevel, PointsHistoryEntry } from './passport.types';
import type { PassportError } from './passport.errors';
import { errors } from './passport.errors';
import { mockLevels, mockUserPoints, mockHistory } from './passport.data';

// Re-tipamos Result con nuestro error específico
type PassportResult<T> = Result<T> & (
  | { ok: true; data: T }
  | { ok: false; error: PassportError }
);

// ── Helper: calcular nivel actual ─────────────────────────────────────────────

function calculateCurrentLevel(points: number, levels: PassportLevel[]): number {
  // Buscar el nivel más alto donde el usuario cumple el minPoints
  for (let i = levels.length - 1; i >= 0; i--) {
    if (points >= levels[i].minPoints) return i;
  }
  return 0;
}

// ── Simulación de latencia (solo dev) ─────────────────────────────────────────

const SIMULATED_DELAY_MS = 10;

async function simulateNetwork<T>(data: T): Promise<T> {
  if (process.env.NODE_ENV === 'development') {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));
  }
  return data;
}

// ── GET: Resumen del pasaporte ────────────────────────────────────────────────

/**
 * Obtiene el resumen completo del pasaporte del usuario:
 * nivel actual (calculado), puntos, y todos los niveles con sus rangos.
 *
 * TODO: Reemplazar mock por:
 *   const res = await backendFetch('/api/v1/passport/summary', { context: 'PASSPORT' });
 */
export async function getPassportSummary(): Promise<PassportResult<PassportSummary>> {
  try {
    // TODO: Reemplazar por backendFetch + mapSummaryFromBackend
    const levels = await simulateNetwork(mockLevels);
    const points = await simulateNetwork(mockUserPoints);

    if (!levels || levels.length === 0) {
      return { ok: false, error: errors.passportUnavailable('Empty levels data') };
    }

    const currentLevelIndex = calculateCurrentLevel(points, levels);

    return {
      ok: true,
      data: { currentLevelIndex, points, levels },
    };
  } catch (err) {
    console.error('[PASSPORT] getPassportSummary → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}

// ── GET: Historial de puntos ──────────────────────────────────────────────────

/**
 * Obtiene el historial de movimientos de puntos del usuario.
 *
 * TODO: Reemplazar mock por:
 *   const res = await backendFetch('/api/v1/passport/history', { context: 'PASSPORT' });
 */
export async function getPointsHistory(): Promise<PassportResult<PointsHistoryEntry[]>> {
  try {
    // TODO: Reemplazar por backendFetch + mapHistoryEntryFromBackend
    const data = await simulateNetwork(mockHistory);

    return { ok: true, data: data ?? [] };
  } catch (err) {
    console.error('[PASSPORT] getPointsHistory → error:', err);
    return { ok: false, error: errors.historyUnavailable(String(err)) };
  }
}
