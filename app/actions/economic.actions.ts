'use server';

import { EconomicProfile, EconomicProfileStatus, Debt } from '@/lib/types';
import { requireValidSession } from './auth.actions';
import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

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

function mapProfileFromBackend(raw: any): EconomicProfile & { verified: boolean } {
  return {
    loan_purpose:     raw.loanPurpose,
    monthly_expenses: raw.monthlyExpenses,
    has_debts:        raw.hasDebts,
    debts: (raw.debts ?? []).map((d: any): Debt => ({
      id:             d.id,
      entity:         d.entity,
      type:           d.type,
      amount:         d.amount,
      monthlyPayment: d.monthlyPayment,
    })),
    has_property:    raw.hasProperty,
    has_vehicle:     raw.hasVehicle,
    has_services:    raw.hasServices,
    education_level: raw.educationLevel,
    verified:        raw.verified ?? false,
  };
}

// ── Manejo de errores del backend ─────────────────────────────────────────────

async function parseBackendError(res: Response): Promise<string> {
  try {
    const json = await res.json();
    return json.detail ?? json.error ?? 'Error al guardar.';
  } catch {
    return 'Error al guardar.';
  }
}

function isSuccess(status: number): boolean {
  return status >= 200 && status < 300;
}

// ── GET: Estado completo ──────────────────────────────────────────────────────

export async function getEconomicProfileStatus(): Promise<EconomicProfileStatus> {
  await requireValidSession();

  try {
    const res = await backendFetch('/api/v1/economic/status');

    if (!res.ok) {
      console.error('[ECONOMIC] Error al obtener estado:', res.status);
      return { profile: null, overall_verified: false };
    }

    const json = await res.json();

    return {
      profile:          json.profile ? mapProfileFromBackend(json.profile) : null,
      overall_verified: json.overallVerified ?? false,
    };
  } catch (error) {
    console.error('[ECONOMIC] Error de conexión al obtener estado:', error);
    return { profile: null, overall_verified: false };
  }
}

// ── PUT: Guardar perfil económico ─────────────────────────────────────────────

export async function saveEconomicProfile(
  profile: Omit<EconomicProfile, 'verified'>
): Promise<{ success: boolean; error?: string }> {
  await requireValidSession();

  try {
    const res = await backendFetch('/api/v1/economic/profile', {
      method: 'PUT',
      body: JSON.stringify({
        loanPurpose:     profile.loan_purpose,
        monthlyExpenses: profile.monthly_expenses,
        hasDebts:        profile.has_debts,
        // El backend genera los IDs — no se envía id en cada deuda
        debts: (profile.has_debts ? profile.debts : []).map(d => ({
          entity:         d.entity,
          type:           d.type,
          amount:         d.amount,
          monthlyPayment: d.monthlyPayment,
        })),
        hasProperty:    profile.has_property,
        hasVehicle:     profile.has_vehicle,
        hasServices:    profile.has_services,
        educationLevel: profile.education_level,
      }),
    });

    if (isSuccess(res.status)) return { success: true };

    const error = await parseBackendError(res);
    return { success: false, error };
  } catch (error) {
    console.error('[ECONOMIC] Error al guardar perfil:', error);
    return { success: false, error: 'Error de conexión.' };
  }
}
