'use server';

import { EconomicProfile, EconomicProfileStatus, Debt } from '@/lib/types';
import { requireValidSession } from './auth.actions';
import { backendFetch as _backendFetch } from '@/lib/backend-fetch';
import { networkError } from '@/lib/action-utils';
import { getEditMetadata } from '@/lib/server/form-edit-policies';

const backendFetch = (path: string, options?: RequestInit) =>
  _backendFetch(path, { ...options, context: 'ECONOMIC' });

// ── Tipo de resultado extendido para Economic ───────────────────────────────────

/**
 * Extiende ActionResult con campos específicos de Economic:
 * - blockedHoursLeft: horas restantes cuando el módulo está bloqueado (429)
 * - attemptsLeft:     intentos restantes cuando el backend devuelve 422
 * - maxAttempts:      máximo de intentos (3)
 */
export type EconomicSaveResult =
  | { success: true; httpStatus: number }
  | {
      success: false;
      httpStatus: number;
      errorCategory: import('@/lib/types').ErrorCategory;
      error: string;
      blockedHoursLeft?: number;
      attemptsLeft?: number;
      maxAttempts?: number;
    };

// ── Helper: parsear respuesta de economic ─────────────────────────────────────

async function parseEconomicResponse(res: Response): Promise<EconomicSaveResult> {
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

  // 429 — módulo bloqueado por max intentos
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

  // 422 — datos no válidos (consume intento, attempts_left, field_errors)
  if (res.status === 422) {
    const attemptsLeft = json.attempts_left ?? json.attemptsLeft;
    const maxAttempts = json.max_attempts ?? 3;
    const error = json.message ?? json.detail ?? 'Los datos económicos no son válidos.';

    return {
      success: false,
      httpStatus: 422,
      errorCategory: 'validation',
      attemptsLeft,
      maxAttempts,
      error,
    };
  }

  // 400 — error de formato (no consume intento, ProblemDetail o Spring validation)
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

// ── Mappers: backend (camelCase) ↔ frontend (snake_case) ─────────────────────

function mapProfileFromBackend(raw: any): EconomicProfile & { verified: boolean } {
  return {
    loan_purpose:     raw.loan_purpose ?? raw.loanPurpose,
    monthly_expenses: raw.monthly_expenses ?? raw.monthlyExpenses,
    has_debts:        raw.has_debts ?? raw.hasDebts,
    debts: (raw.debts ?? []).map((d: any): Debt => ({
      id:             d.id ?? crypto.randomUUID(),
      entity:         d.entity ?? d.creditor ?? '',
      type:           d.type,
      amount:         d.amount,
      monthlyPayment: d.monthly_payment ?? d.monthlyPayment ?? 0,
    })),
    has_property:    raw.has_property ?? raw.hasProperty,
    has_vehicle:     raw.has_vehicle ?? raw.hasVehicle,
    has_services:    raw.has_services ?? raw.hasServices,
    education_level: raw.education_level ?? raw.educationLevel,
    verified:        true,
  };
}

// ── GET: Estado completo ──────────────────────────────────────────────────────

export async function getEconomicProfileStatus(): Promise<EconomicProfileStatus> {
  await requireValidSession();

  try {
    const res = await backendFetch('/api/v1/economic/status');

    // 404 es esperado para usuarios nuevos que aún no tienen Economic
    if (res.status === 404) {
      console.log('[ECONOMIC] Usuario sin Economic previo (404) — estado inicial normal');
      return { profile: null, overall_verified: false };
    }

    if (!res.ok) {
      console.error('[ECONOMIC] Error al obtener estado:', res.status);
      return { profile: null, overall_verified: false };
    }

    const json = await res.json();

    // El backend devuelve el nuevo formato con submission.submission_data
    let parsedData: Record<string, any> | null = null;
    if (json.submission?.submission_data) {
      try {
        parsedData = JSON.parse(json.submission.submission_data);
      } catch {
        console.error('[ECONOMIC] Error parseando submission_data');
      }
    }

    const status = json.status as import('@/lib/types').EconomicStatus | undefined;
    const verified = status === 'VERIFIED';

    // Calcular metadatos de edición
    const editMetadata = await getEditMetadata('economic', verified);

    return {
      profile:          parsedData ? mapProfileFromBackend(parsedData) : null,
      overall_verified: verified,
      status,
      editMetadata,
    };
  } catch (error) {
    console.error('[ECONOMIC] Error de conexión al obtener estado:', error);
    return { profile: null, overall_verified: false };
  }
}

// ── PUT: Validar perfil económico completo ─────────────────────────────────────

export async function saveEconomicProfile(
  profile: Omit<EconomicProfile, 'verified'>
): Promise<EconomicSaveResult> {
  await requireValidSession();

  try {
    const res = await backendFetch('/api/v1/economic/validate', {
      method: 'PUT',
      body: JSON.stringify({
        loanPurpose:     profile.loan_purpose,
        monthlyExpenses: profile.monthly_expenses,
        hasDebts:        profile.has_debts,
        debts: (profile.has_debts ? profile.debts : []).map(d => ({
          creditor: d.entity,
          amount:   d.amount,
          type:     d.type,
          monthlyPayment: d.monthlyPayment,
        })),
        hasProperty:    profile.has_property,
        hasVehicle:     profile.has_vehicle,
        hasServices:    profile.has_services,
        educationLevel: profile.education_level,
      }),
    });
    return parseEconomicResponse(res);
  } catch {
    console.error('[ECONOMIC] Error al guardar perfil económico');
    return networkError();
  }
}
