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
import type { PaginatedRequest, PaginatedResponse } from '@/modules/shared/pagination';
import { DEFAULT_PAGE_REQUEST } from '@/modules/shared/pagination';
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
 * Obtiene el historial de movimientos de puntos del usuario (paginado).
 *
 * TODO: Reemplazar mock por:
 *   const params = buildPageParams(request);
 *   const res = await backendFetch(`/api/v1/passport/history?${params}`, { context: 'PASSPORT' });
 *   return mapSpringPage(res, mapHistoryEntryFromBackend);
 */
export async function getPointsHistory(
  request: PaginatedRequest = DEFAULT_PAGE_REQUEST,
): Promise<PassportResult<PaginatedResponse<PointsHistoryEntry>>> {
  try {
    // Simular paginación sobre el mock
    let filtered = [...mockHistory];

    // Búsqueda
    if (request.search) {
      const q = request.search.toLowerCase();
      filtered = filtered.filter((e) => e.description.toLowerCase().includes(q));
    }

    // Ordenamiento (por fecha por defecto)
    filtered.sort((a, b) => {
      const dir = request.sortDir === 'asc' ? 1 : -1;
      return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    // Paginar
    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / request.size);
    const start = request.page * request.size;
    const items = filtered.slice(start, start + request.size);

    return {
      ok: true,
      data: {
        items,
        totalElements,
        totalPages,
        page: request.page,
        size: request.size,
        first: request.page === 0,
        last: request.page >= totalPages - 1,
      },
    };
  } catch (err) {
    console.error('[PASSPORT] getPointsHistory → error:', err);
    return { ok: false, error: errors.historyUnavailable(String(err)) };
  }
}
