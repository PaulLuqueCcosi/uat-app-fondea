'use server';

import {
  LaborSituation,
  LaborDetails,
  LaborIncome,
  LaborProfileStatus,
  EmploymentStatus,
  AdditionalIncome,
  ActionResult,
} from '@/lib/types';
import { requireValidSession } from './auth.actions';
import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';
import { parseBackendResponse, networkError } from '@/lib/action-utils';

// ── Helper: fetch autenticado al backend ──────────────────────────────────────

async function backendFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessTokenRSC(logtoConfig, process.env.LOGTO_API_RESOURCE);
  const baseUrl = process.env.BACKEND_API_URL ?? 'http://localhost:8080';

  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
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
): Promise<ActionResult> {
  await requireValidSession();

  try {
    const res = await backendFetch('/api/v1/labor/situation', {
      method: 'PUT',
      body: JSON.stringify({ employmentStatus: employment_status }),
    });
    return parseBackendResponse(res);
  } catch {
    console.error('[LABOR] Error al guardar situación');
    return networkError();
  }
}

// ── PUT: Detalles laborales ───────────────────────────────────────────────────

export async function saveLaborDetails(
  details: Omit<LaborDetails, 'verified'>
): Promise<ActionResult> {
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
    return parseBackendResponse(res);
  } catch {
    console.error('[LABOR] Error al guardar detalles');
    return networkError();
  }
}

// ── PUT: Ingresos ─────────────────────────────────────────────────────────────

export async function saveLaborIncome(
  income: Omit<LaborIncome, 'verified'>
): Promise<ActionResult> {
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
    return parseBackendResponse(res);
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
): Promise<ActionResult> {
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
    return parseBackendResponse(res);
  } catch {
    console.error('[LABOR] Error al guardar perfil completo');
    return networkError();
  }
}
