'use server';

import { KYCData } from '@/lib/types';
import { requireValidSession } from './auth.actions';
import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

// ── Respuesta pública al frontend ────────────────────────────────────────────

export interface KYCSaveResult {
  success: boolean;
  error?: string;
  blocked?: boolean;
  blockedHoursLeft?: number;
  attemptsLeft?: number;
}

// ── Helper: fetch autenticado al backend ─────────────────────────────────────

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

// ── GET: Estado KYC ──────────────────────────────────────────────────────────

export async function getKYCData(): Promise<{
  data: KYCData | null;
  blocked: boolean;
  blockedHoursLeft: number;
  attemptsLeft: number;
}> {
  await requireValidSession();

  try {
    const res = await backendFetch('/api/v1/kyc/status');

    if (!res.ok) {
      console.error('[KYC] Error al obtener estado:', res.status);
      return { data: null, blocked: false, blockedHoursLeft: 0, attemptsLeft: 3 };
    }

    const json = await res.json();

    // Mapear birthDate → birth_date para el frontend
    const data: KYCData | null = json.data
      ? { ...json.data, birth_date: json.data.birthDate ?? json.data.birth_date }
      : null;

    return {
      data,
      blocked: json.blocked ?? false,
      blockedHoursLeft: json.blockedHoursLeft ?? 0,
      attemptsLeft: json.attemptsLeft ?? 3,
    };
  } catch (error) {
    console.error('[KYC] Error de conexión al obtener estado:', error);
    return { data: null, blocked: false, blockedHoursLeft: 0, attemptsLeft: 3 };
  }
}

// ── POST: Validar KYC ────────────────────────────────────────────────────────

export async function saveKYCData(data: KYCData): Promise<KYCSaveResult> {
  await requireValidSession();

  try {
    // Mapear birth_date → birthDate para el backend
    const body = {
      dni:              data.dni,
      firstName:        data.firstName,
      secondName:       data.secondName,
      firstLastName:    data.firstLastName,
      secondLastName:   data.secondLastName,
      verificationCode: data.verificationCode,
      birthDate:        data.birth_date,   // ← el backend espera birthDate
    };

    const res = await backendFetch('/api/v1/kyc/validate', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const json = await res.json();

    // 200 — éxito
    if (res.ok) {
      return { success: true };
    }

    // 429 — bloqueado
    if (res.status === 429) {
      return {
        success: false,
        blocked: true,
        blockedHoursLeft: json.blockedHoursLeft ?? 24,
        error: json.error ?? `Demasiados intentos. Podrás intentarlo en ${json.blockedHoursLeft ?? 24} horas.`,
      };
    }

    // 400 — datos inválidos o RENIEC rechazó
    return {
      success: false,
      attemptsLeft: json.attemptsLeft,
      error: json.error ?? 'Los datos no coinciden. Verifica que sean exactamente como aparecen en tu DNI.',
    };

  } catch (error) {
    console.error('[KYC] Error de conexión:', error);
    return {
      success: false,
      error: 'Error de conexión. Por favor, inténtalo nuevamente.',
    };
  }
}
