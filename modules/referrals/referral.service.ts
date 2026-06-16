/**
 * Service de Referidos.
 *
 * HOY: mock data.
 * MAÑANA: backendFetch al endpoint real.
 */

import type { Result } from '@/modules/shared/result';
import type { ReferralSummary, Referral } from './referral.types';
import type { ReferralError } from './referral.errors';
import { errors } from './referral.errors';
import { mockSummary, mockReferrals } from './referral.data';

type RefResult<T> = Result<T> & (
  | { ok: true; data: T }
  | { ok: false; error: ReferralError }
);

/**
 * Obtiene el resumen del programa de referidos + lista de referidos.
 * Un usuario tendrá pocos referidos — se devuelve todo junto.
 */
export async function getReferralData(): Promise<RefResult<{
  summary: ReferralSummary;
  referrals: Referral[];
}>> {
  try {
    // TODO: const res = await backendFetch('/api/v1/referrals', { context: 'REFERRALS' });
    return {
      ok: true,
      data: {
        summary: mockSummary,
        referrals: mockReferrals,
      },
    };
  } catch (err) {
    console.error('[REFERRALS] getReferralData → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}
