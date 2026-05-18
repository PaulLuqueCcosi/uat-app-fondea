'use server';

import { KYCData, KycStatus } from '@/lib/types';
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
      maxAttempts?: number;
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

    // El backend puede devolver dos formatos:
    // 1. Formato plano: { data: { dni, firstName, ..., birthDate } }
    // 2. Formato verificado: { status: "VERIFIED", submission: { submission_data: '{"dni":...}' } }
    const raw = json.data ?? null;
    const backendStatus: KycStatus | undefined = json.status as KycStatus | undefined;

    // Si viene con estructura de submission (KYC con estado del backend)
    let parsedData: Record<string, any> | null = raw;
    if (!raw && json.submission?.submission_data) {
      try {
        parsedData = JSON.parse(json.submission.submission_data);
      } catch {
        console.error('[KYC] Error parseando submission_data');
      }
    }

    // Mapear birthDate → birth_date para el frontend, convirtiendo YYYY-MM-DD → DD/MM/YYYY
    const rawDate: string | undefined = parsedData?.birthDate ?? parsedData?.birth_date;
    const birth_date = rawDate?.match(/^\d{4}-\d{2}-\d{2}$/)
      ? rawDate.split('-').reverse().join('/')   // "2003-06-19" → "19/06/2003"
      : rawDate;

    // Status del backend (VERIFIED, EXPIRED, REPLACED, PENDING)
    const status = backendStatus ?? parsedData?.status;
    const verified = status === 'VERIFIED';

    const data: KYCData | null = parsedData
      ? {
          dni: parsedData.dni ?? '',
          firstName: parsedData.firstName ?? '',
          secondName: parsedData.secondName ?? '',
          firstLastName: parsedData.firstLastName ?? '',
          secondLastName: parsedData.secondLastName ?? '',
          verificationCode: parsedData.verificationCode ?? '',
          birth_date: birth_date ?? '',
          status,
          verified,
        }
      : null;

    return {
      data,
      blocked: json.blocked ?? false,
      blockedHoursLeft: json.blocked_hours_left ?? json.blockedHoursLeft ?? 0,
      attemptsLeft: json.attempts_left ?? json.attemptsLeft ?? 3,
    };
  } catch (error) {
    console.error('[KYC] Error de conexión al obtener estado:', error);
    return { data: null, blocked: false, blockedHoursLeft: 0, attemptsLeft: 3, backendUnavailable: true };
  }
}

// ── PUT: Validar KYC ────────────────────────────────────────────────────────

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
      method: 'PUT',
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

    // 200/201 — identidad verificada ✅ (PUT puede devolver ambos)
    if (res.status === 200 || res.status === 201) {
      return { success: true, httpStatus: res.status };
    }

    let json: any = {};
    try { json = await res.json(); } catch { /* body vacío */ }

    // 429 — bloqueado por demasiados intentos
    if (res.status === 429) {
      const hoursLeft = json.blocked_hours_left ?? json.blockedHoursLeft ?? json.detail?.blockedHoursLeft ?? 24;
      return {
        success: false,
        httpStatus: 429,
        errorCategory: 'rate_limit',
        blockedHoursLeft: hoursLeft,
        error: json.message ?? `Demasiados intentos fallidos. Tu cuenta quedará bloqueada por ${hoursLeft} hora${hoursLeft !== 1 ? 's' : ''}.`,
      };
    }

    // 409 — cuenta sin DNI registrado (necesita re-login)
    if (res.status === 409) {
      return {
        success: false,
        httpStatus: 409,
        errorCategory: 'conflict',
        action: 're-login',
        error: json.message ?? json.detail ?? 'No se encontró un documento registrado en tu cuenta. Por favor, cierra sesión e inicia sesión nuevamente.',
      };
    }

    // 422 — datos no coinciden (attempts_left, message, error_code)
    if (res.status === 422) {
      const attemptsLeft = json.attempts_left ?? json.attemptsLeft;
      const maxAttempts = json.max_attempts ?? 3;
      const baseError = json.message ?? json.error ?? 'Los datos no coinciden con los registros de RENIEC.';

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
        maxAttempts,
        error,
      };
    }

    // 400 — formato inválido o edad fuera de rango (Problem Detail, no consume intento)
    if (res.status === 400) {
      const detail = json.message ?? json.detail ?? json.error ?? 'Los datos ingresados tienen un formato inválido. Verifica que sean exactamente como aparecen en tu DNI.';
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
      error: json.message ?? json.error ?? json.detail ?? 'Error inesperado. Por favor, inténtalo nuevamente.',
    };

  } catch {
    console.error('[KYC] Error de conexión');
    return networkError();
  }
}
