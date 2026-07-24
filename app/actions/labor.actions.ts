'use server';

import {
  LaborSituation,
  LaborDetails,
  LaborIncome,
  LaborProfileStatus,
  EmploymentStatus,
  AdditionalIncome,
} from '@/lib/types';
import { requireValidSession } from './auth.actions';
import { backendFetch as _backendFetch } from '@/lib/backend-fetch';
import { networkError } from '@/lib/action-utils';
import { getEditMetadata } from '@/lib/server/form-edit-policies';

const backendFetch = (path: string, options?: RequestInit) =>
  _backendFetch(path, { ...options, context: 'LABOR' });

// ── Tipo de resultado extendido para Labor ────────────────────────────────────

/**
 * Extiende ActionResult con campos específicos de Labor:
 * - blockedHoursLeft: horas restantes cuando el módulo está bloqueado (429)
 * - attemptsLeft:     intentos restantes cuando el backend devuelve 422
 * - maxAttempts:      máximo de intentos (3)
 */
export type LaborSaveResult =
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

// ── Helper: parsear respuesta de labor ────────────────────────────────────────

async function parseLaborResponse(res: Response): Promise<LaborSaveResult> {
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
    const error = json.message ?? json.detail ?? 'Los datos laborales no son válidos.';

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
    // Extraer el primer fieldError si existe, sino usar detail/message
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

function mapSituationFromBackend(raw: any): LaborSituation & { verified: boolean } {
  return {
    employment_status: raw.employment_status ?? raw.employmentStatus ?? raw.situation,
    verified: true,
  };
}

function mapDetailsFromBackend(raw: any): LaborDetails & { verified: boolean } {
  return {
    industry: raw.industry,
    years_of_activity: raw.years_of_activity ?? raw.yearsOfActivity,
    business_ruc: raw.business_ruc ?? raw.businessRuc ?? undefined,
    verified: true,
  };
}

function mapIncomeFromBackend(raw: any): LaborIncome & { verified: boolean } {
  return {
    monthly_income: raw.monthly_income ?? raw.monthlyIncome,
    income_receipt_method: raw.income_receipt_method ?? raw.incomeReceiptMethod,
    has_additional_income: raw.has_additional_income ?? raw.hasAdditionalIncome,
    additional_incomes: (raw.additional_incomes ?? raw.additionalIncomes ?? []).map((i: any): AdditionalIncome => ({
      id: i.id ?? crypto.randomUUID(),
      type: i.type,
      custom_type: i.custom_type ?? i.customType,
      amount: i.amount,
      description: i.description,
    })),
    verified: true,
  };
}

// ── GET: Estado completo ──────────────────────────────────────────────────────

export async function getLaborProfileStatus(): Promise<LaborProfileStatus> {
  await requireValidSession();

  try {
    const res = await backendFetch('/api/v1/labor/status');

    // 404 es esperado para usuarios nuevos que aún no tienen Labor
    if (res.status === 404) {
      console.log('[LABOR] Usuario sin Labor previo (404) — estado inicial normal');
      return { situation: null, details: null, income: null, overall_verified: false };
    }

    if (!res.ok) {
      console.error('[LABOR] Error al obtener estado:', res.status);
      return { situation: null, details: null, income: null, overall_verified: false };
    }

    const json = await res.json();

    // El backend devuelve el nuevo formato con submission.submission_data
    let parsedData: Record<string, any> | null = null;
    if (json.submission?.submission_data) {
      try {
        parsedData = JSON.parse(json.submission.submission_data);
      } catch {
        console.error('[LABOR] Error parseando submission_data');
      }
    }

    const status = json.status as import('@/lib/types').LaborStatus | undefined;
    const verified = status === 'VERIFIED';

    // Calcular metadatos de edición
    const editMetadata = getEditMetadata('labor', verified);

    return {
      situation: parsedData?.situation ? mapSituationFromBackend(parsedData) : null,
      details:   parsedData?.details   ? mapDetailsFromBackend(parsedData.details)   : null,
      income:    parsedData?.income    ? mapIncomeFromBackend(parsedData.income)     : null,
      overall_verified: verified,
      status,
      editMetadata,
    };
  } catch (error) {
    console.error('[LABOR] Error de conexión al obtener estado:', error);
    return { situation: null, details: null, income: null, overall_verified: false };
  }
}

// ── PUT: Validar perfil laboral completo ───────────────────────────────────────

export async function saveLaborProfile(
  situation: EmploymentStatus,
  details: Omit<LaborDetails, 'verified'> | null,
  income: Omit<LaborIncome, 'verified'> | null
): Promise<LaborSaveResult> {
  await requireValidSession();

  try {
    const res = await backendFetch('/api/v1/labor/validate', {
      method: 'PUT',
      body: JSON.stringify({
        situation: situation,
        details: details ? {
          industry:        details.industry ?? null,
          yearsOfActivity: details.years_of_activity ?? null,  // Ya es string (enum)
          businessRuc:     details.business_ruc ?? null,
        } : null,
        income: income ? {
          monthlyIncome:       income.monthly_income ?? null,
          incomeReceiptMethod: income.income_receipt_method ?? null,
          hasAdditionalIncome: income.has_additional_income ?? false,
          additionalIncomes: (income.has_additional_income ? income.additional_incomes : []).map(i => ({
            type:        i.type,
            customType:  i.type === 'OTRO' ? i.custom_type : undefined,
            amount:      i.amount,
            description: i.description ?? undefined,
          })),
        } : null,
      }),
    });
    return parseLaborResponse(res);
  } catch {
    console.error('[LABOR] Error al guardar perfil laboral');
    return networkError();
  }
}
