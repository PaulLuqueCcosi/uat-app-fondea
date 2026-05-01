'use server';

import { BankAccountProfile, BankAccountProfileStatus, ActionResult } from '@/lib/types';
import { requireValidSession } from './auth.actions';
import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';
import { parseBackendResponse, networkError } from '@/lib/action-utils';

// ── Helpers internos ──────────────────────────────────────────────────────────

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

// ── GET: Estado completo ──────────────────────────────────────────────────────

/**
 * Obtiene el estado completo de la cuenta bancaria del usuario.
 * Retorna el perfil y si está verificado.
 */
export async function getBankAccountProfileStatus(): Promise<BankAccountProfileStatus> {
  await requireValidSession();
  
  try {
    const res = await backendFetch('/api/v1/bank-account/status');
    if (!res.ok) return { profile: null, overall_verified: false };
    
    const json = await res.json();
    const profile: (BankAccountProfile & { verified: boolean }) | null = json.profile
      ? {
          bank:         json.profile.bank,
          account_type: json.profile.account_type,
          cci:          json.profile.cci,
          verified:     json.profile.verified ?? false,
        }
      : null;
    
    return { profile, overall_verified: json.overall_verified ?? false };
  } catch (error) {
    console.error('[BANK_ACCOUNT] Error al obtener estado:', error);
    return { profile: null, overall_verified: false };
  }
}

// ── POST: Guardar cuenta bancaria ─────────────────────────────────────────────

export async function saveBankAccountProfile(
  data: Omit<BankAccountProfile, 'verified'>
): Promise<ActionResult> {
  await requireValidSession();

  try {
    // Validaciones del lado cliente (adicionales a las del backend)
    if (!data.bank || data.bank.trim().length === 0) {
      return { success: false, httpStatus: 0, errorCategory: 'validation', error: 'Selecciona tu banco.' };
    }

    if (!data.account_type || !['AHORROS', 'CORRIENTE'].includes(data.account_type)) {
      return { success: false, httpStatus: 0, errorCategory: 'validation', error: 'Selecciona el tipo de cuenta.' };
    }

    if (!data.cci || !/^\d{20}$/.test(data.cci)) {
      return { success: false, httpStatus: 0, errorCategory: 'validation', error: 'El CCI debe tener exactamente 20 dígitos.' };
    }

    const body = {
      bank: data.bank.trim(),
      account_type: data.account_type,
      cci: data.cci,
    };

    const res = await backendFetch('/api/v1/bank-account/profile', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return parseBackendResponse(res);
  } catch {
    console.error('[BANK_ACCOUNT] Error al guardar');
    return networkError();
  }
}
