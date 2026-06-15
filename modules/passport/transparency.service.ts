/**
 * Service de Transparencia — consecuencias de mora por producto.
 *
 * HOY: mock data.
 * MAÑANA: GET /api/v1/products/{productId}/transparency
 */

import type { Result } from '@/modules/shared/result';
import type { TransparencyConfig } from './transparency.types';
import { errors } from './passport.errors';

// ── Mock ──────────────────────────────────────────────────────────────────────

const mockConfig: TransparencyConfig = {
  productId: 'default',
  currency: 'PEN',
  scenarios: [
    {
      id: 'on-time',
      fromDay: 0,
      toDay: 0,
      title: 'Pago puntual',
      description: '+15 puntos en tu pasaporte',
      severity: 'positive',
      penaltyPerDay: null,
    },
    {
      id: 'late-1-3',
      fromDay: 1,
      toDay: 3,
      title: '1 a 3 días',
      description: 'Penalidad de S/ 5 por día',
      severity: 'low',
      penaltyPerDay: 5,
    },
    {
      id: 'late-4-14',
      fromDay: 4,
      toDay: 14,
      title: '4 a 14 días',
      description: 'Penalidad de S/ 7 por día',
      severity: 'medium',
      penaltyPerDay: 7,
    },
    {
      id: 'late-15-plus',
      fromDay: 15,
      toDay: null,
      title: '15+ días',
      description: 'Penalidad de S/ 10 por día',
      severity: 'critical',
      penaltyPerDay: 10,
    },
  ],
  tip: 'Pagar a tiempo te da puntos para subir de nivel y desbloquear mejores montos de crédito.',
};

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * Obtiene la configuración de transparencia para un producto.
 *
 * TODO: Reemplazar por:
 *   const res = await backendFetch(`/api/v1/products/${productId}/transparency`);
 */
export async function getTransparencyConfig(
  _productId?: string,
): Promise<Result<TransparencyConfig>> {
  try {
    // TODO: backendFetch + mapper
    return { ok: true, data: mockConfig };
  } catch (err) {
    console.error('[TRANSPARENCY] getTransparencyConfig → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}
