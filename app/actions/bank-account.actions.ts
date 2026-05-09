'use server';

import { BankAccountProfile, BankAccountProfileStatus } from '@/lib/types';
import { requireValidSession } from './auth.actions';
import { backendFetch as _backendFetch } from '@/lib/backend-fetch';
import { networkError } from '@/lib/action-utils';

const backendFetch = (path: string, options?: RequestInit) =>
  _backendFetch(path, { ...options, context: 'BANK_ACCOUNT' });

// ── Tipo de resultado extendido ───────────────────────────────────────────────

/**
 * Extiende ActionResult con campos específicos de BankAccount:
 * - attemptsLeft: intentos restantes cuando la validación de CCI falla (422)
 * - blockedHoursLeft: horas restantes cuando está bloqueado (429)
 */
export type BankAccountSaveResult =
  | { success: true; httpStatus: number }
  | {
      success: false;
      httpStatus: number;
      errorCategory: import('@/lib/types').ErrorCategory;
      error: string;
      attemptsLeft?: number;
      blockedHoursLeft?: number;
    };

// ── Helper: parsear respuesta de bank-account ─────────────────────────────────

async function parseBankAccountResponse(res: Response): Promise<BankAccountSaveResult> {
  // 200 — éxito (CCI validado, titular coincide)
  if (res.ok) {
    return { success: true, httpStatus: res.status };
  }

  let json: any = {};
  try { json = await res.json(); } catch { /* body vacío */ }

  // 429 — bloqueado por max intentos
  if (res.status === 429) {
    return {
      success: false,
      httpStatus: 429,
      errorCategory: 'rate_limit',
      blockedHoursLeft: json.blockedHoursLeft ?? 24,
      error: json.detail ?? 'Demasiados intentos fallidos. Podrás intentarlo nuevamente en 24 horas.',
    };
  }

  // 422 — CCI inválido o usuario no es titular (consume intento)
  if (res.status === 422) {
    const fieldError = json.fieldErrors?.cci;
    const message = json.error ?? fieldError ?? 'La cuenta no pudo ser validada.';
    return {
      success: false,
      httpStatus: 422,
      errorCategory: 'validation',
      attemptsLeft: json.attemptsLeft,
      error: message,
    };
  }

  // 500 — error técnico del proveedor (no consume intento)
  if (res.status >= 500) {
    return {
      success: false,
      httpStatus: res.status,
      errorCategory: 'server',
      error: json.detail ?? 'Error técnico al validar tu cuenta. No se consumió un intento. Inténtalo en unos minutos.',
    };
  }

  // 400 — error de formato
  if (res.status === 400) {
    const firstFieldError = json.fieldErrors
      ? Object.values(json.fieldErrors)[0] as string
      : undefined;
    return {
      success: false,
      httpStatus: 400,
      errorCategory: 'validation',
      error: firstFieldError ?? json.detail ?? 'Error de validación en los datos ingresados.',
    };
  }

  // 401 — sesión expirada
  if (res.status === 401) {
    return {
      success: false,
      httpStatus: 401,
      errorCategory: 'auth',
      error: 'Tu sesión expiró. Por favor, vuelve a iniciar sesión.',
    };
  }

  // Cualquier otro error
  return {
    success: false,
    httpStatus: res.status,
    errorCategory: 'unknown',
    error: json.detail ?? json.error ?? 'Error inesperado. Por favor, inténtalo nuevamente.',
  };
}

// ── GET: Estado completo ──────────────────────────────────────────────────────

export async function getBankAccountProfileStatus(): Promise<BankAccountProfileStatus> {
  await requireValidSession();

  try {
    const res = await backendFetch('/api/v1/bank-account/status');
    if (!res.ok) return { profile: null, overall_verified: false };

    const json = await res.json();

    console.log('[BANK_ACCOUNT] GET status →', JSON.stringify(json)?.slice(0, 200));

    // El backend devuelve { profile: { bank, account_type, cci, verified }, overall_verified }
    const raw = json?.profile;
    if (!raw || !raw.bank) {
      return { profile: null, overall_verified: json?.overall_verified ?? false };
    }

    const profile: BankAccountProfile & { verified: boolean } = {
      bank:         raw.bank,
      account_type: raw.accountType ?? raw.account_type,
      cci:          raw.cci,
      verified:     raw.verified ?? false,
    };

    return { profile, overall_verified: json.overall_verified ?? raw.verified ?? false };
  } catch (error) {
    console.error('[BANK_ACCOUNT] Error al obtener estado:', error);
    return { profile: null, overall_verified: false };
  }
}

// ── POST: Guardar cuenta bancaria ─────────────────────────────────────────────

export async function saveBankAccountProfile(
  data: Omit<BankAccountProfile, 'verified'>
): Promise<BankAccountSaveResult> {
  await requireValidSession();

  console.log('[BANK_ACCOUNT] saveBankAccountProfile recibido:', JSON.stringify(data));

  try {
    // Validación defensiva — Zod debería prevenir esto, pero por seguridad
    if (!data.account_type) {
      return {
        success: false,
        httpStatus: 0,
        errorCategory: 'validation',
        error: 'Selecciona el tipo de cuenta.',
      };
    }

    const body = {
      bank: data.bank.trim(),
      account_type: data.account_type,
      cci: data.cci,
    };

    console.log('[BANK_ACCOUNT] POST → body:', JSON.stringify(body));

    const res = await backendFetch('/api/v1/bank-account/profile', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return parseBankAccountResponse(res);
  } catch {
    console.error('[BANK_ACCOUNT] Error al guardar');
    return networkError();
  }
}
