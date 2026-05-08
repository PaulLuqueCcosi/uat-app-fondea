'use server';

import { KYCData } from '@/lib/types';
import { requireValidSession } from './auth.actions';
import { backendFetch } from '@/lib/backend-fetch';
import { networkError } from '@/lib/action-utils';

// ── Respuesta pública al frontend ────────────────────────────────────────────

/**
 * Extiende ActionResult con campos específicos de KYC:
 * - blockedHoursLeft: horas restantes cuando el backend devuelve 429
 * - attemptsLeft:     intentos restantes cuando el backend devuelve 400
 */
export type KYCSaveResult =
  | { success: true; httpStatus: number }
  | {
      success: false;
      httpStatus: number;
      errorCategory: import('@/lib/types').ErrorCategory;
      error: string;
      blockedHoursLeft?: number;
      attemptsLeft?: number;
      /** Cuando el backend indica que el usuario debe re-loguearse (409) */
      action?: 're-login';
    };

// ── Helper: fetch autenticado al backend ─────────────────────────────────────

// Usa el backendFetch centralizado de lib/backend-fetch.ts con contexto KYC
const kycFetch = (path: string, options?: RequestInit) =>
  backendFetch(path, { ...options, context: 'KYC' });

// ── GET: Estado KYC ──────────────────────────────────────────────────────────

export async function getKYCData(): Promise<{
  data: KYCData | null;
  blocked: boolean;
  blockedHoursLeft: number;
  attemptsLeft: number;
  backendUnavailable?: boolean;
}> {
  await requireValidSession();

  try {
    const res = await kycFetch('/api/v1/kyc/status');

    if (res.status === 503) {
      return { data: null, blocked: false, blockedHoursLeft: 0, attemptsLeft: 3, backendUnavailable: true };
    }

    if (!res.ok) {
      // 404 es esperado para usuarios nuevos que aún no tienen KYC
      if (res.status === 404) {
        console.log('[KYC] Usuario sin KYC previo (404) — estado inicial normal');
      } else {
        console.error('[KYC] Error al obtener estado:', res.status);
      }
      return { data: null, blocked: false, blockedHoursLeft: 0, attemptsLeft: 3 };
    }

    const json = await res.json();

    // Mapear birthDate → birth_date para el frontend, convirtiendo YYYY-MM-DD → DD/MM/YYYY
    const rawDate: string | undefined = json.data?.birthDate ?? json.data?.birth_date;
    const birth_date = rawDate?.match(/^\d{4}-\d{2}-\d{2}$/)
      ? rawDate.split('-').reverse().join('/')   // "2003-06-19" → "19/06/2003"
      : rawDate;

    const data: KYCData | null = json.data
      ? { ...json.data, birth_date }
      : null;

    return {
      data,
      blocked: json.blocked ?? false,
      blockedHoursLeft: json.blockedHoursLeft ?? 0,
      attemptsLeft: json.attemptsLeft ?? 3,
    };
  } catch (error) {
    console.error('[KYC] Error de conexión al obtener estado:', error);
    return { data: null, blocked: false, blockedHoursLeft: 0, attemptsLeft: 3, backendUnavailable: true };
  }
}

// ── POST: Validar KYC ────────────────────────────────────────────────────────

export async function saveKYCData(data: KYCData): Promise<KYCSaveResult> {
  await requireValidSession();

  try {
    const [day, month, year] = (data.birth_date ?? '').split('/');
    const birthDateISO = day && month && year ? `${year}-${month}-${day}` : data.birth_date;

    const body = {
      dni:              data.dni,
      firstName:        data.firstName,
      secondName:       data.secondName,
      firstLastName:    data.firstLastName,
      secondLastName:   data.secondLastName,
      verificationCode: data.verificationCode,
      birthDate:        birthDateISO,
    };

    const res = await kycFetch('/api/v1/kyc/validate', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    // 503 — backend / token no disponible
    if (res.status === 503) {
      return {
        success: false,
        httpStatus: 503,
        errorCategory: 'server',
        error: 'El servicio no está disponible en este momento. Por favor, inténtalo más tarde.',
      };
    }

    // 200 — identidad verificada ✅
    if (res.status === 200) {
      return { success: true, httpStatus: 200 };
    }

    let json: any = {};
    try { json = await res.json(); } catch { /* body vacío */ }

    // 429 — bloqueado por demasiados intentos
    if (res.status === 429) {
      const hoursLeft = json.blockedHoursLeft ?? json.detail?.blockedHoursLeft ?? 24;
      return {
        success: false,
        httpStatus: 429,
        errorCategory: 'rate_limit',
        blockedHoursLeft: hoursLeft,
        error: `Demasiados intentos fallidos. Tu cuenta quedará bloqueada por ${hoursLeft} hora${hoursLeft !== 1 ? 's' : ''}.`,
      };
    }

    // 409 — cuenta sin DNI registrado (necesita re-login)
    if (res.status === 409) {
      return {
        success: false,
        httpStatus: 409,
        errorCategory: 'conflict',
        action: 're-login',
        error: json.detail ?? 'No se encontró un documento registrado en tu cuenta. Por favor, cierra sesión e inicia sesión nuevamente.',
      };
    }

    // 422 — datos no coinciden con RENIEC (tiene attemptsLeft y fieldErrors)
    if (res.status === 422) {
      const attemptsLeft = json.attemptsLeft;
      const baseError = json.error ?? 'Los datos no coinciden con los registros de RENIEC.';

      // Construir mensaje con advertencia de intentos si quedan pocos
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
        error,
      };
    }

    // 400 — formato inválido o edad fuera de rango (Problem Detail, no consume intento)
    if (res.status === 400) {
      const detail = json.detail ?? json.error ?? 'Los datos ingresados tienen un formato inválido. Verifica que sean exactamente como aparecen en tu DNI.';
      return {
        success: false,
        httpStatus: 400,
        errorCategory: 'validation',
        error: detail,
      };
    }

    // 500 — error técnico del proveedor (no consume intento, puede reintentar)
    if (res.status >= 500) {
      return {
        success: false,
        httpStatus: res.status,
        errorCategory: 'server',
        error: 'Error técnico al verificar tus datos. No se consumió un intento. Por favor, inténtalo de nuevo en unos minutos.',
      };
    }

    // Cualquier otro error
    return {
      success: false,
      httpStatus: res.status,
      errorCategory: 'unknown',
      error: json.error ?? json.detail ?? 'Error inesperado. Por favor, inténtalo nuevamente.',
    };

  } catch {
    console.error('[KYC] Error de conexión');
    return networkError();
  }
}
