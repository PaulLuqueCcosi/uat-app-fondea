/**
 * Service de Referidos.
 *
 * Endpoint real: GET /api/v1/referidos
 * Respuesta: { code, total_referred, total_completed, total_points }
 */

import type { Result } from '@/modules/shared/result';
import type { ReferralSummary, Referral } from './referral.types';
import type { ReferralError } from './referral.errors';
import { errors } from './referral.errors';
import { backendFetch } from '@/lib/backend-fetch';

type RefResult<T> = Result<T> & (
  | { ok: true; data: T }
  | { ok: false; error: ReferralError }
);

/**
 * Obtiene el resumen del programa de referidos.
 * GET /api/v1/referidos
 */
export async function getReferralData(): Promise<RefResult<ReferralSummary>> {
  try {
    const res = await backendFetch('/api/v1/referidos', { context: 'REFERRALS' });

    if (res.status === 401) {
      return { ok: false, error: errors.sessionExpired() };
    }

    if (!res.ok) {
      console.error('[REFERRALS] → HTTP', res.status);
      return { ok: false, error: errors.unavailable(`HTTP ${res.status}`) };
    }

    const raw = await res.json();

    const summary: ReferralSummary = {
      code: raw.code ?? '',
      link: `https://fondea.pe/r/${raw.code ?? ''}`,
      totalReferrals: raw.total_referred ?? raw.totalReferred ?? 0,
      completedReferrals: raw.total_completed ?? raw.totalCompleted ?? 0,
      totalPointsEarned: raw.total_points ?? raw.totalPoints ?? 0,
      pointsPerReferral: 50, // Configurable desde backend en el futuro
    };

    return { ok: true, data: summary };
  } catch (err) {
    console.error('[REFERRALS] getReferralData → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}


/**
 * Obtiene la lista de referidos del usuario.
 * GET /api/v1/referidos/lista
 */
export async function getReferralsList(): Promise<RefResult<Referral[]>> {
  try {
    const res = await backendFetch('/api/v1/referidos/lista', { context: 'REFERRALS' });

    if (res.status === 401) {
      return { ok: false, error: errors.sessionExpired() };
    }

    if (res.status === 404) {
      return { ok: true, data: [] };
    }

    if (!res.ok) {
      console.error('[REFERRALS] lista → HTTP', res.status);
      return { ok: false, error: errors.unavailable(`HTTP ${res.status}`) };
    }

    const raw = await res.json();
    const list: Referral[] = (Array.isArray(raw) ? raw : []).map((item: any) => ({
      id: item.id ?? '',
      referredUserId: item.referred_user_id ?? item.referredUserId ?? '',
      registeredAt: item.created_at ?? item.createdAt ?? '',
      completedAt: item.completed_at ?? item.completedAt ?? null,
      status: item.status ?? 'REGISTERED',
      pointsAwarded: item.points_awarded ?? item.pointsAwarded ?? 0,
    }));

    // Ordenar por fecha descendente
    list.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

    return { ok: true, data: list };
  } catch (err) {
    console.error('[REFERRALS] getReferralsList → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}
