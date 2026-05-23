/**
 * Mapper: respuesta del backend → ScoreConfig del frontend.
 */

import type { PuntajeConfig } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapScoreFromBackend(data: any): PuntajeConfig {
  return {
    points: data.points as number,
    maxLoanAmount: data.maxLoanAmount as number,
  };
}
