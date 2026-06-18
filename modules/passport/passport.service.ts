/**
 * Service del Pasaporte Financiero — la ÚNICA puerta a los datos.
 *
 * Endpoints reales:
 * - GET /api/v1/score → puntos + nivel actual
 * - GET /api/v1/score/rangos → todos los niveles/rangos
 * - GET /api/v1/score/historial → historial de movimientos
 *
 * Retorna Result<T> — los consumidores nunca ven errores crudos.
 */

import type { Result } from '@/modules/shared/result';
import type { PassportSummary, PointsHistoryEntry } from './passport.types';
import type { PassportError } from './passport.errors';
import { errors } from './passport.errors';
import { backendFetch } from '@/lib/backend-fetch';
import { mapSummaryFromBackend, mapHistoryEntryFromBackend } from './passport.mapper';

// Re-tipamos Result con nuestro error específico
type PassportResult<T> = Result<T> & (
  | { ok: true; data: T }
  | { ok: false; error: PassportError }
);

// ── GET: Resumen del pasaporte ────────────────────────────────────────────────

/**
 * Obtiene el resumen completo del pasaporte del usuario:
 * nivel actual, puntos, y todos los niveles disponibles.
 *
 * Llama a 2 endpoints en paralelo:
 * - GET /api/v1/score → { points, maxLoanAmount, categoryName }
 * - GET /api/v1/score/rangos → [{ categoryName, minPoints, maxPoints, maxLoanAmount }]
 */
export async function getPassportSummary(): Promise<PassportResult<PassportSummary>> {
  try {
    const [scoreRes, rangosRes] = await Promise.all([
      backendFetch('/api/v1/score', { context: 'PASSPORT' }),
      backendFetch('/api/v1/score/rangos', { context: 'PASSPORT' }),
    ]);

    // Manejar errores de score
    if (scoreRes.status === 401) {
      return { ok: false, error: errors.sessionExpired() };
    }
    if (!scoreRes.ok) {
      console.error('[PASSPORT] score → HTTP', scoreRes.status);
      return { ok: false, error: errors.passportUnavailable(`score HTTP ${scoreRes.status}`) };
    }

    // Manejar errores de rangos
    if (!rangosRes.ok) {
      console.error('[PASSPORT] rangos → HTTP', rangosRes.status);
      return { ok: false, error: errors.passportUnavailable(`rangos HTTP ${rangosRes.status}`) };
    }

    const scoreData = await scoreRes.json();
    const rangosData = await rangosRes.json();

    if (!rangosData || !Array.isArray(rangosData) || rangosData.length === 0) {
      return { ok: false, error: errors.passportUnavailable('Empty rangos data') };
    }

    const summary = mapSummaryFromBackend(scoreData, rangosData);
    return { ok: true, data: summary };
  } catch (err) {
    console.error('[PASSPORT] getPassportSummary → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}

// ── GET: Historial de puntos ──────────────────────────────────────────────────

/**
 * Obtiene el historial de movimientos de puntos del usuario.
 * GET /api/v1/score/historial
 *
 * El backend devuelve un array (no paginado por ahora).
 * El frontend maneja la paginación client-side con TanStack Table.
 */
export async function getPointsHistory(): Promise<PassportResult<PointsHistoryEntry[]>> {
  try {
    const res = await backendFetch('/api/v1/score/historial', { context: 'PASSPORT' });

    if (res.status === 401) {
      return { ok: false, error: errors.sessionExpired() };
    }

    if (res.status === 404) {
      // Sin historial — es un estado válido
      return { ok: true, data: [] };
    }

    if (!res.ok) {
      console.error('[PASSPORT] historial → HTTP', res.status);
      return { ok: false, error: errors.historyUnavailable(`HTTP ${res.status}`) };
    }

    const raw = await res.json();
    const history = (Array.isArray(raw) ? raw : raw.content ?? []).map(mapHistoryEntryFromBackend);

    // Ordenar por fecha descendente
    history.sort((a: PointsHistoryEntry, b: PointsHistoryEntry) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { ok: true, data: history };
  } catch (err) {
    console.error('[PASSPORT] getPointsHistory → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}
