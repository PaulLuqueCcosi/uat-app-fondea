/**
 * Service del Pasaporte Financiero — la ÚNICA puerta a los datos.
 *
 * Responsabilidades:
 * - Obtener resumen del pasaporte (nivel actual, puntos, niveles disponibles)
 * - Obtener historial de movimientos de puntos
 *
 * HOY: retorna data mock.
 * MAÑANA: backendFetch al endpoint real + mappers.
 *
 * Retorna Result<T> — los consumidores nunca ven errores crudos.
 */

import type { Result } from '@/modules/shared/result';
import type { PassportSummary, PointsHistoryEntry } from './passport.types';
import type { PassportError } from './passport.errors';
import { errors } from './passport.errors';
import { mockSummary, mockHistory } from './passport.data';

// Re-tipamos Result con nuestro error específico
type PassportResult<T> = Result<T> & (
  | { ok: true; data: T }
  | { ok: false; error: PassportError }
);

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
 * nivel actual, puntos, progreso, y todos los niveles disponibles.
 *
 * TODO: Reemplazar mock por:
 *   const res = await backendFetch('/api/v1/passport/summary', { context: 'PASSPORT' });
 */
export async function getPassportSummary(): Promise<PassportResult<PassportSummary>> {
  try {
    // TODO: Reemplazar por backendFetch + mapSummaryFromBackend
    const data = await simulateNetwork(mockSummary);

    if (!data || !data.levels || data.levels.length === 0) {
      return { ok: false, error: errors.passportUnavailable('Empty summary data') };
    }

    return { ok: true, data };
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
