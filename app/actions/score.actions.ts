'use server';

import { PuntajeConfig } from '@/lib/types';
import { backendFetch } from '@/lib/backend-fetch';
import { mapScoreFromBackend } from '@/lib/mappers/score.mapper';

/**
 * Obtiene el score del usuario — puntaje del sistema que determina su límite de préstamo.
 * NO es Score Crediticio (eso es diferente).
 * Retorna null si no tiene score (404) o hay error.
 *
 * GET /api/v1/score
 */
export async function getScore(): Promise<PuntajeConfig | null> {
  console.log('[SCORE] getScore → consultando backend...');
  try {
    const res = await backendFetch('/api/v1/score', { context: 'SCORE' });

    if (res.status === 404) {
      console.log('[SCORE] getScore → 404: sin score disponible');
      return null;
    }

    if (!res.ok) {
      let errorBody = '(sin body)';
      try { errorBody = await res.text(); } catch {}
      console.error(`[SCORE] getScore → error ${res.status}:`, errorBody);
      return null;
    }

    const data = await res.json();
    console.log('[SCORE] getScore → ✅ encontrado:', { points: data.points, maxLoanAmount: data.maxLoanAmount });
    return mapScoreFromBackend(data);

  } catch (error) {
    console.error('[SCORE] getScore → network error:', error);
    return null;
  }
}
