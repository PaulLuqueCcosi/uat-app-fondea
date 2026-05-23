'use client';

import { getScore as getScoreAction } from '@/app/actions/score.actions';
import type { PuntajeConfig } from '@/lib/types';

/**
 * Client API wrapper para obtener el score del usuario.
 * Score = puntaje del sistema que determina límite de préstamo.
 * NO es Score Crediticio (eso es diferente).
 * Llama al server action que hace fetch al backend real.
 */
export async function getScore(): Promise<PuntajeConfig | null> {
  try {
    return await getScoreAction();
  } catch (error) {
    console.error('[Score Client API] Error:', error);
    return null;
  }
}
