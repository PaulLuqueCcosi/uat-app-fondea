'use server';

import { BankAccountProfile, BankAccountProfileStatus } from '@/lib/types';
import { requireValidSession } from './auth.actions';
import { backendFetch as _backendFetch } from '@/lib/backend-fetch';
import { networkError } from '@/lib/action-utils';

const backendFetch = (path: string, options?: RequestInit) =>
  _backendFetch(path, { ...options, context: 'BANK_ACCOUNT' });

// ── Tipo de resultado extendido ───────────────────────────────────────────────

export type BankAccountSaveResult =
  | { success: true; httpStatus: number }
  | {
      success: false;
      httpStatus: number;
      errorCategory: import('@/lib/types').ErrorCategory;
      error: string;
      attemptsLeft?: number;
      blockedHoursLeft?: number;
      maxAttempts?: number;
    };

// ── Helper: parsear respuesta de bank-account ─────────────────────────────────

async function parseBankAccountResponse(res: Response): Promise<BankAccountSaveResult> {
  // 200/201 — éxito
  if (res.status === 200 || res.status === 201) {
    return { success: true, httpStatus: res.status };
  }

  let json: any = {};
  try { json = await res.json(); } catch { /* body vacío o no-JSON */ }

  // 503 — error técnico del proveedor (no consume intento)
  if (res.status === 503) {
    return {
      success: false,
      httpStatus: 503,
      errorCategory: 'server',
      error: json.message ?? json.detail ?? 'Servicio de validación temporalmente no disponible. No se consumió un intento. Inténtalo en unos minutos.',
    };
  }

  // 429 — bloqueado por max intentos
  if (res.status === 429) {
    const hoursLeft = json.blocked_hours_left ?? json.blockedHoursLeft ?? 24;
    return {
      success: false,
      httpStatus: 429,
      errorCategory: 'rate_limit',
      blockedHoursLeft: hoursLeft,
      error: json.message ?? `Demasiados intentos fallidos. Tu cuenta quedará bloqueada por ${hoursLeft} hora${hoursLeft !== 1 ? 's' : ''}.`,
    };
  }

  // 422 — datos no válidos (consume intento)
  if (res.status === 422) {
    const attemptsLeft = json.attempts_left ?? json.attemptsLeft;
    const maxAttempts = json.max_attempts ?? 3;
    const baseError = json.message ?? json.detail ?? 'La cuenta bancaria no es válida.';

    let error = baseError;
    if (attemptsLeft === 1) {
      error = `${baseError} ¡Cuidado! Este es tu último intento antes de quedar bloqueado.`;
    } else if (attemptsLeft !== undefined) {
      error = `${baseError} Te quedan ${attemptsLeft} intento${attemptsLeft !== 1 ? 's' : ''}.`;
    }

    return {
      success: false,
      httpStatus: 422,
      errorCategory: 'validation',
      attemptsLeft,
      maxAttempts,
      error,
    };
  }

  // 400 — error de formato (no consume intento)
  if (res.status === 400) {
    const firstFieldError = json.fieldErrors
      ? Object.values(json.fieldErrors)[0] as string
      : undefined;
    const message = firstFieldError ?? json.message ?? json.detail ?? 'Los datos ingresados tienen un formato inválido. Verifica que sean correctos.';
    return {
      success: false,
      httpStatus: 400,
      errorCategory: 'validation',
      error: message,
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
    error: json.message ?? json.detail ?? json.error ?? 'Error inesperado. Por favor, inténtalo nuevamente.',
  };
}

// ── Mapper ──────────────────────────────────────────────────────────────────────

function mapProfileFromBackend(raw: any): BankAccountProfile & { verified: boolean } {
  return {
    bank_name: raw.bank_name ?? raw.bank ?? '',
    account_type: raw.account_type ?? '',
    cci: raw.cci ?? '',
    account_number: raw.account_number ?? '',
    verified: true,
  };
}

// ── GET: Estado completo ──────────────────────────────────────────────────────

export async function getBankAccountProfileStatus(): Promise<BankAccountProfileStatus> {
  await requireValidSession();
  try {
    const res = await backendFetch('/api/v1/bank-account/status');

    // 404 es esperado para usuarios nuevos
    if (res.status === 404) {
      console.log('[BANK_ACCOUNT] Usuario sin cuenta bancaria previa (404) — estado inicial normal');
      return { profile: null, overall_verified: false };
    }

    if (!res.ok) {
      console.error('[BANK_ACCOUNT] Error al obtener estado:', res.status);
      return { profile: null, overall_verified: false };
    }

    const json = await res.json();

    // El backend devuelve el nuevo formato con submission.submission_data
    let parsedData: Record<string, any> | null = null;
    if (json.submission?.submission_data) {
      try {
        parsedData = JSON.parse(json.submission.submission_data);
      } catch {
        console.error('[BANK_ACCOUNT] Error parseando submission_data');
      }
    }

    const status = json.status as import('@/lib/types').BankAccountStatus | undefined;
    const verified = status === 'VERIFIED';

    return {
      profile: parsedData ? mapProfileFromBackend(parsedData) : null,
      overall_verified: verified,
      status,
    };
  } catch (error) {
    console.error('[BANK_ACCOUNT] Error al obtener estado:', error);
    return { profile: null, overall_verified: false };
  }
}

// ── PUT: Validar cuenta bancaria ───────────────────────────────────────────────

export async function saveBankAccountProfile(
  data: Omit<BankAccountProfile, 'verified'>
): Promise<BankAccountSaveResult> {
  await requireValidSession();
  try {
    const body = {
      bank_name: data.bank_name,
      account_type: data.account_type,
      cci: data.cci,
      account_number: data.account_number,
    };

    const res = await backendFetch('/api/v1/bank-account/validate', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return parseBankAccountResponse(res);
  } catch {
    console.error('[BANK_ACCOUNT] Error al guardar');
    return networkError();
  }
}

// ── GET: Revelar número de cuenta ─────────────────────────────────────────────

export type RevealResult =
  | { success: true; value: string; warning: string }
  | { success: false; error: string };

export async function revealAccountNumber(): Promise<RevealResult> {
  await requireValidSession();
  try {
    const res = await backendFetch('/api/v1/bank-account/reveal');
    if (!res.ok) {
      return { success: false, error: 'No se pudo revelar el número de cuenta' };
    }
    const json = await res.json();
    return {
      success: true,
      value: json.account_number,
      warning: json.warning,
    };
  } catch {
    return { success: false, error: 'Error al revelar el número de cuenta' };
  }
}

// ── GET: Revelar CCI ────────────────────────────────────────────────────────────

export async function revealCCI(): Promise<RevealResult> {
  await requireValidSession();
  try {
    const res = await backendFetch('/api/v1/bank-account/reveal-cci');
    if (!res.ok) {
      return { success: false, error: 'No se pudo revelar el CCI' };
    }
    const json = await res.json();
    return {
      success: true,
      value: json.account_number,
      warning: json.warning,
    };
  } catch {
    return { success: false, error: 'Error al revelar el CCI' };
  }
}
