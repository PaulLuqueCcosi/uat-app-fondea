/**
 * Service de la cuenta de depósito — conectado al backend (módulo `depositos`).
 *
 * <p>Dos audiencias, dos rutas:
 * - Cliente: `GET /api/v1/deposit-account-config` (solo la vigente)
 * - Admin: `/api/v1/admin/deposit-account-config` (crear versión, historial, subir QR)
 *
 * <p>El backend responde 204 cuando el admin nunca configuró una cuenta. Eso NO es un
 * error de sistema, pero para el cliente sí es un bloqueo: no puede depositar. Se traduce
 * a `NOT_CONFIGURED` con un mensaje que le da salida.
 */

import type { Result } from '@/modules/shared/result';
import { backendFetch } from '@/lib/backend-fetch';
import type {
  DepositAccountConfig,
  SaveDepositAccountConfigRequest,
} from './deposit-account.types';
import type { DepositAccountError } from './deposit-account.errors';
import { errors } from './deposit-account.errors';
import { mapDepositAccountConfigFromBackend } from './deposit-account.mapper';

type DepositAccountResult<T> = Result<T> & (
  | { ok: true; data: T }
  | { ok: false; error: DepositAccountError }
);

const CTX = 'DEPOSIT_ACCOUNT';

// ─── Cliente ──────────────────────────────────────────────────────────────────

/**
 * Cuenta vigente para mostrarle al cliente antes de subir su comprobante.
 * GET /api/v1/deposit-account-config
 */
export async function getActiveDepositAccount(): Promise<DepositAccountResult<DepositAccountConfig>> {
  try {
    const res = await backendFetch('/api/v1/deposit-account-config', { context: CTX });

    // 204 = el admin nunca configuró una cuenta.
    if (res.status === 204) return { ok: false, error: errors.notConfigured() };
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    return { ok: true, data: mapDepositAccountConfigFromBackend(raw) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

/** GET /api/v1/admin/deposit-account-config */
export async function getAdminActiveDepositAccount(): Promise<DepositAccountResult<DepositAccountConfig | null>> {
  try {
    const res = await backendFetch('/api/v1/admin/deposit-account-config', { context: CTX });

    // Para el admin, "no hay cuenta" es un estado válido de la pantalla (recién arranca y
    // tiene que crear la primera), no un error — devuelve null.
    if (res.status === 204) return { ok: true, data: null };
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    return { ok: true, data: mapDepositAccountConfigFromBackend(raw) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

/** GET /api/v1/admin/deposit-account-config/history */
export async function getDepositAccountHistory(): Promise<DepositAccountResult<DepositAccountConfig[]>> {
  try {
    const res = await backendFetch('/api/v1/admin/deposit-account-config/history', { context: CTX });

    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    return { ok: true, data: (raw ?? []).map(mapDepositAccountConfigFromBackend) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

/**
 * Crea una versión nueva y la activa (desactiva la anterior).
 * POST /api/v1/admin/deposit-account-config
 */
export async function createDepositAccount(
  request: SaveDepositAccountConfigRequest,
): Promise<DepositAccountResult<DepositAccountConfig>> {
  try {
    const res = await backendFetch('/api/v1/admin/deposit-account-config', {
      context: CTX,
      method: 'POST',
      body: JSON.stringify({
        bankName: request.bankName,
        accountNumber: request.accountNumber,
        accountType: request.accountType ?? null,
        cci: request.cci ?? null,
        holderName: request.holderName,
        description: request.description ?? null,
        keepCurrentQrImage: request.keepCurrentQrImage,
      }),
    });

    if (res.status === 400) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: errors.validationFailed(body.detail ?? body.message) };
    }
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: errors.validationFailed(body.detail ?? body.message) };
    }

    const raw = await res.json();
    return { ok: true, data: mapDepositAccountConfigFromBackend(raw) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

/**
 * Sube o reemplaza el QR de una versión.
 * POST /api/v1/admin/deposit-account-config/{id}/qr-image (multipart)
 *
 * `headers: {}` es necesario para que backendFetch no fuerce Content-Type — con FormData
 * el boundary lo pone fetch.
 */
export async function uploadDepositAccountQr(
  configId: string,
  formData: FormData,
): Promise<DepositAccountResult<DepositAccountConfig>> {
  try {
    const res = await backendFetch(`/api/v1/admin/deposit-account-config/${configId}/qr-image`, {
      context: CTX,
      method: 'POST',
      body: formData,
      headers: {},
    });

    if (res.status === 400) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: errors.uploadFailed(body.detail ?? body.message) };
    }
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status === 404) return { ok: false, error: errors.notFound(configId) };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: errors.uploadFailed(body.detail ?? body.message) };
    }

    const raw = await res.json();
    return { ok: true, data: mapDepositAccountConfigFromBackend(raw) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}
