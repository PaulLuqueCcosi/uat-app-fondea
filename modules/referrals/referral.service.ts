/**
 * Service de Referidos — conectado al backend real.
 *
 * Endpoints:
 * - GET  /api/v1/referidos           → código + stats
 * - GET  /api/v1/referidos/lista     → lista de mis referidos
 * - GET  /api/v1/referidos/mi-referidor → quién me refirió
 * - GET  /api/v1/referidos/validar?code=XXX → validar código (sin auth)
 * - POST /api/v1/referidos/usar      → aplicar código manualmente
 */

import type { Result } from '@/modules/shared/result';
import type { ReferralSummary, Referral, MyReferrer } from './referral.types';
import type { ReferralError } from './referral.errors';
import { errors } from './referral.errors';
import { backendFetch } from '@/lib/backend-fetch';

type RefResult<T> = Result<T> & (
  | { ok: true; data: T }
  | { ok: false; error: ReferralError }
);

const CTX = 'REFERRALS';

// ─── Mi código + estadísticas ─────────────────────────────────────────────────

/**
 * Obtiene el código de referido del usuario + estadísticas.
 * GET /api/v1/referidos
 */
export async function getReferralData(): Promise<RefResult<ReferralSummary>> {
  try {
    const res = await backendFetch('/api/v1/referidos', { context: CTX });

    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (!res.ok) return { ok: false, error: errors.unavailable(`HTTP ${res.status}`) };

    const raw = await res.json();

    const appUrl = process.env.LOGTO_BASE_URL ?? 'https://app.fondea.pe';
    const summary: ReferralSummary = {
      code: raw.code ?? '',
      link: `${appUrl}/?ref=${raw.code ?? ''}`,
      totalReferred: raw.total_referred ?? 0,
      totalCompleted: raw.total_completed ?? 0,
    };

    return { ok: true, data: summary };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

// ─── Lista de mis referidos ───────────────────────────────────────────────────

/**
 * Obtiene la lista de personas que usaron mi código.
 * GET /api/v1/referidos/lista
 */
export async function getReferralsList(): Promise<RefResult<Referral[]>> {
  try {
    const res = await backendFetch('/api/v1/referidos/lista', { context: CTX });

    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status === 404) return { ok: true, data: [] };
    if (!res.ok) return { ok: false, error: errors.unavailable(`HTTP ${res.status}`) };

    const raw = await res.json();
    const list: Referral[] = (Array.isArray(raw) ? raw : []).map((item: any) => ({
      id: item.id ?? '',
      referredUserId: item.referred_user_id ?? '',
      status: item.status ?? 'REGISTERED',
      createdAt: item.created_at ?? '',
      completedAt: item.completed_at ?? null,
    }));

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { ok: true, data: list };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

// ─── Mi referidor ─────────────────────────────────────────────────────────────

/**
 * Consulta si tengo un código de referido aplicado (quién me refirió).
 * GET /api/v1/referidos/mi-referidor
 * 200 → tiene referidor | 204 → no tiene (puede aplicar uno)
 */
export async function getMyReferrer(): Promise<RefResult<MyReferrer | null>> {
  try {
    const res = await backendFetch('/api/v1/referidos/mi-referidor', { context: CTX });

    if (res.status === 204) return { ok: true, data: null };
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (!res.ok) return { ok: false, error: errors.unavailable(`HTTP ${res.status}`) };

    const raw = await res.json();
    return {
      ok: true,
      data: {
        referrerUserId: raw.referrer_user_id ?? '',
        status: raw.status ?? 'REGISTERED',
        appliedAt: raw.applied_at ?? '',
      },
    };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

// ─── Validar código (sin auth) ────────────────────────────────────────────────

/**
 * Valida si un código de referido existe.
 * GET /api/v1/referidos/validar?code=XXX
 * No requiere autenticación.
 */
export async function validateReferralCode(code: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${process.env.BACKEND_API_URL ?? 'http://localhost:8080'}/api/v1/referidos/validar?code=${encodeURIComponent(code)}`,
    );
    if (!res.ok) return false;
    const data = await res.json();
    return data.valid === true;
  } catch {
    return false;
  }
}

// ─── Aplicar código manualmente ───────────────────────────────────────────────

/**
 * Aplica un código de referido al usuario autenticado.
 * POST /api/v1/referidos/usar
 * Solo si aún no tiene uno. Una vez aplicado no se puede cambiar.
 */
export async function applyReferralCode(code: string): Promise<RefResult<void>> {
  try {
    const res = await backendFetch('/api/v1/referidos/usar', {
      context: CTX,
      method: 'POST',
      body: JSON.stringify({ code }),
    });

    if (res.status === 200) return { ok: true, data: undefined };
    if (res.status === 400) return { ok: false, error: errors.ownCode() };
    if (res.status === 404) return { ok: false, error: errors.codeNotFound() };
    if (res.status === 409) return { ok: false, error: errors.alreadyApplied() };
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };

    return { ok: false, error: errors.serverError(res.status) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}
