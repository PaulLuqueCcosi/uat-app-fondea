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

const backendFetch = (path: string, options?: RequestInit) =>
  _backendFetch(path, { ...options, context: 'LABOR' });

// ── Tipo de resultado extendido para Labor ────────────────────────────────────

/**
 * Extiende ActionResult con campos específicos de Labor:
 * - blockedHoursLeft: horas restantes cuando el módulo está bloqueado (429)
 *
 * El módulo se bloquea cuando la validación de RUC falla 3 veces.
 * El bloqueo afecta a TODO el módulo (situation, details, income).
 */
export type LaborSaveResult =
  | { success: true; httpStatus: number }
  | {
      success: false;
      httpStatus: number;
      errorCategory: import('@/lib/types').ErrorCategory;
      error: string;
      blockedHoursLeft?: number;
    };

// ── Helper: parsear respuesta de labor ────────────────────────────────────────

async function parseLaborResponse(res: Response): Promise<LaborSaveResult> {
  // 200/201 — éxito
  if (res.ok) {
    return { success: true, httpStatus: res.status };
  }

  let json: any = {};
  try { json = await res.json(); } catch { /* body vacío o no-JSON */ }

  // 429 — módulo bloqueado por max intentos de RUC
  if (res.status === 429) {
    return {
      success: false,
      httpStatus: 429,
      errorCategory: 'rate_limit',
      blockedHoursLeft: json.blockedHoursLeft ?? 24,
      error: json.detail ?? 'Demasiados intentos fallidos. Podrás intentarlo nuevamente en 24 horas.',
    };
  }

  // 422 — RUC inválido/inactivo/no titular (consume intento)
  if (res.status === 422) {
    const fieldError = json.fieldErrors?.businessRuc;
    const message = fieldError ?? json.detail ?? 'Error en la validación del RUC.';
    return {
      success: false,
      httpStatus: 422,
      errorCategory: 'validation',
      error: message,
    };
  }

  // 503 — error técnico del proveedor de RUC (no consume intento)
  if (res.status === 503) {
    return {
      success: false,
      httpStatus: 503,
      errorCategory: 'server',
      error: json.detail ?? 'Servicio de validación temporalmente no disponible. No se consumió un intento. Inténtalo en unos minutos.',
    };
  }

  // 400 — error de formato o regla de negocio
  if (res.status === 400) {
    // Extraer el primer fieldError si existe, sino usar detail
    const firstFieldError = json.fieldErrors
      ? Object.values(json.fieldErrors)[0] as string
      : undefined;
    const message = firstFieldError ?? json.detail ?? 'Error de validación en los datos ingresados.';
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
    error: json.detail ?? json.error ?? 'Error inesperado. Por favor, inténtalo nuevamente.',
  };
}

// ── Mappers: backend (camelCase) ↔ frontend (snake_case) ─────────────────────

function mapSituationFromBackend(raw: any): LaborSituation & { verified: boolean } {
  return {
    employment_status: raw.employmentStatus,
    verified: raw.verified ?? false,
  };
}

function mapDetailsFromBackend(raw: any): LaborDetails & { verified: boolean } {
  return {
    industry: raw.industry,
    years_of_activity: raw.yearsOfActivity,
    business_ruc: raw.businessRuc ?? undefined,
    verified: raw.verified ?? false,
  };
}

function mapIncomeFromBackend(raw: any): LaborIncome & { verified: boolean } {
  return {
    monthly_income: raw.monthlyIncome,
    income_receipt_method: raw.incomeReceiptMethod,
    has_additional_income: raw.hasAdditionalIncome,
    additional_incomes: (raw.additionalIncomes ?? []).map((i: any): AdditionalIncome => ({
      id: i.id,
      type: i.type,
      custom_type: i.customType,
      amount: i.amount,
      description: i.description,
    })),
    verified: raw.verified ?? false,
  };
}

// ── Manejo de errores del backend ─────────────────────────────────────────────

// ── GET: Estado completo ──────────────────────────────────────────────────────

export async function getLaborProfileStatus(): Promise<LaborProfileStatus> {
  await requireValidSession();

  try {
    const res = await backendFetch('/api/v1/labor/status');

    if (!res.ok) {
      console.error('[LABOR] Error al obtener estado:', res.status);
      return { situation: null, details: null, income: null, overall_verified: false };
    }

    const json = await res.json();

    return {
      situation: json.situation ? mapSituationFromBackend(json.situation) : null,
      details:   json.details   ? mapDetailsFromBackend(json.details)     : null,
      income:    json.income     ? mapIncomeFromBackend(json.income)       : null,
      overall_verified: json.overallVerified ?? false,
    };
  } catch (error) {
    console.error('[LABOR] Error de conexión al obtener estado:', error);
    return { situation: null, details: null, income: null, overall_verified: false };
  }
}

// ── PUT: Situación laboral ────────────────────────────────────────────────────

export async function saveLaborSituation(
  employment_status: EmploymentStatus
): Promise<LaborSaveResult> {
  await requireValidSession();

  try {
    const res = await backendFetch('/api/v1/labor/situation', {
      method: 'PUT',
      body: JSON.stringify({ employmentStatus: employment_status }),
    });
    return parseLaborResponse(res);
  } catch {
    console.error('[LABOR] Error al guardar situación');
    return networkError();
  }
}

// ── PUT: Detalles laborales ───────────────────────────────────────────────────

export async function saveLaborDetails(
  details: Omit<LaborDetails, 'verified'>
): Promise<LaborSaveResult> {
  await requireValidSession();

  try {
    const res = await backendFetch('/api/v1/labor/details', {
      method: 'PUT',
      body: JSON.stringify({
        industry:        details.industry,
        yearsOfActivity: details.years_of_activity,
        businessRuc:     details.business_ruc ?? null,
      }),
    });
    return parseLaborResponse(res);
  } catch {
    console.error('[LABOR] Error al guardar detalles');
    return networkError();
  }
}

// ── PUT: Ingresos ─────────────────────────────────────────────────────────────

export async function saveLaborIncome(
  income: Omit<LaborIncome, 'verified'>
): Promise<LaborSaveResult> {
  await requireValidSession();

  try {
    const res = await backendFetch('/api/v1/labor/income', {
      method: 'PUT',
      body: JSON.stringify({
        monthlyIncome:       income.monthly_income,
        incomeReceiptMethod: income.income_receipt_method,
        hasAdditionalIncome: income.has_additional_income,
        additionalIncomes: (income.has_additional_income ? income.additional_incomes : []).map(i => ({
          type:        i.type,
          customType:  i.type === 'OTRO' ? i.custom_type : undefined,
          amount:      i.amount,
          description: i.description ?? undefined,
        })),
      }),
    });
    return parseLaborResponse(res);
  } catch {
    console.error('[LABOR] Error al guardar ingresos');
    return networkError();
  }
}

// ── PUT: Perfil completo (wrapper con rollback en backend) ────────────────────

export async function saveLaborProfile(
  situation: EmploymentStatus,
  details: Omit<LaborDetails, 'verified'>,
  income: Omit<LaborIncome, 'verified'>
): Promise<LaborSaveResult> {
  await requireValidSession();

  try {
    const res = await backendFetch('/api/v1/labor/profile', {
      method: 'PUT',
      body: JSON.stringify({
        situation: situation,
        details: {
          industry:        details.industry,
          yearsOfActivity: details.years_of_activity,
          businessRuc:     details.business_ruc ?? null,
        },
        income: {
          monthlyIncome:       income.monthly_income,
          incomeReceiptMethod: income.income_receipt_method,
          hasAdditionalIncome: income.has_additional_income,
          additionalIncomes: (income.has_additional_income ? income.additional_incomes : []).map(i => ({
            type:        i.type,
            customType:  i.type === 'OTRO' ? i.custom_type : undefined,
            amount:      i.amount,
            description: i.description ?? undefined,
          })),
        },
      }),
    });
    return parseLaborResponse(res);
  } catch {
    console.error('[LABOR] Error al guardar perfil completo');
    return networkError();
  }
}
