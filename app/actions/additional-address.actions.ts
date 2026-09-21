'use server';

import { AddressProfile, AddressProfileStatus, ActionResult } from '@/lib/types';
import { requireValidSession } from './auth.actions';
import { backendFetch as _backendFetch } from '@/lib/backend-fetch';
import { networkError } from '@/lib/action-utils';
import { getEditMetadata } from '@/lib/server/form-edit-policies';

const backendFetch = (path: string, options?: RequestInit) =>
  _backendFetch(path, { ...options, context: 'ADDRESS' });


// ── Tipos públicos ────────────────────────────────────────────────────────────

export interface UbigeoOption {
  value: string;
  label: string;
}

// ── Tipo de resultado extendido para Address ───────────────────────────────────

export type AddressSaveResult =
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

// ── Helper: parsear respuesta de address ──────────────────────────────────────

async function parseAddressResponse(res: Response): Promise<AddressSaveResult> {
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
    const error = json.message ?? json.detail ?? 'La dirección no es válida.';

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

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapProfileFromBackend(raw: any): AddressProfile & { verified: boolean } {
  const addressType = (raw.addressType ?? raw.address_type ?? '').toLowerCase();
  return {
    address_type:    'manual' as const,
    street_address:  raw.streetAddress ?? raw.street_address ?? undefined,
    region:          raw.region,
    province:        raw.province,
    district:        raw.district,
    referral_source: raw.referralSource ?? raw.referral_source,
    referral_other:  raw.referralOther ?? raw.referral_other ?? undefined,
    location:        raw.lat && raw.lng ? { lat: raw.lat, lng: raw.lng } : undefined,
    verified:        true,
  };
}

// ── GET: Estado completo ──────────────────────────────────────────────────────

export async function getAddressProfileStatus(): Promise<AddressProfileStatus> {
  await requireValidSession();
  try {
    const res = await backendFetch('/api/v1/address/status');

    // 404 es esperado para usuarios nuevos que aún no tienen Address
    if (res.status === 404) {
      console.log('[ADDRESS] Usuario sin Address previo (404) — estado inicial normal');
      return { profile: null, overall_verified: false };
    }

    if (!res.ok) {
      console.error('[ADDRESS] Error al obtener estado:', res.status);
      return { profile: null, overall_verified: false };
    }

    const json = await res.json();

    // El backend devuelve el nuevo formato con submission.submission_data
    let parsedData: Record<string, any> | null = null;
    if (json.submission?.submission_data) {
      try {
        parsedData = JSON.parse(json.submission.submission_data);
      } catch {
        console.error('[ADDRESS] Error parseando submission_data');
      }
    }

    const status = json.status as import('@/lib/types').AddressStatus | undefined;
    const verified = status === 'VERIFIED';

    // Calcular metadatos de edición
    const editMetadata = await getEditMetadata('address', verified);

    return {
      profile:          parsedData ? mapProfileFromBackend(parsedData) : null,
      overall_verified: verified,
      status,
      editMetadata,
    };
  } catch (error) {
    console.error('[ADDRESS] Error al obtener estado:', error);
    return { profile: null, overall_verified: false };
  }
}

// ── PUT: Validar dirección ────────────────────────────────────────────────────

export async function saveAddressProfile(
  data: Omit<AddressProfile, 'verified'>
): Promise<AddressSaveResult> {
  await requireValidSession();
  try {
    const body: Record<string, unknown> = {
      address_type:    'MANUAL',
      street_address:  data.street_address,
      region:          data.region,
      province:        data.province,
      district:        data.district,
      referral_source: data.referral_source,
      referral_other:  data.referral_source === 'OTRO' ? (data.referral_other ?? '') : null,
    };
    if (data.location?.lat && data.location?.lng) {
      body.lat = data.location.lat;
      body.lng = data.location.lng;
    }

    const res = await backendFetch('/api/v1/address/validate', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return parseAddressResponse(res);
  } catch {
    console.error('[ADDRESS] Error al guardar');
    return networkError();
  }
}

// ── Ubigeo (usando ubigeo-fns) ───────────────────────────────────────────────

import {
  getDepartments,
  getProvinces,
  getDistricts,
  getUbigeoData,
} from 'ubigeo-fns';

export async function getDepartamentosAction(): Promise<UbigeoOption[]> {
  try {
    const data = getDepartments();
    return data.map((d) => ({ value: d.code, label: d.name }))
               .sort((a, b) => a.label.localeCompare(b.label));
  } catch { return []; }
}

export async function getProvinciasAction(regionId: string): Promise<UbigeoOption[]> {
  if (!regionId) return [];
  try {
    const data = getProvinces(regionId);
    return data.map((p) => ({ value: p.code, label: p.name }))
               .sort((a, b) => a.label.localeCompare(b.label));
  } catch { return []; }
}

export async function getDistritosAction(provinceId: string): Promise<UbigeoOption[]> {
  if (!provinceId) return [];
  try {
    const data = getDistricts(provinceId);
    return data.map((d) => ({ value: d.code, label: d.name }))
               .sort((a, b) => a.label.localeCompare(b.label));
  } catch { return []; }
}

/** Obtiene las coordenadas del ubigeo más específico disponible (distrito > provincia > departamento) */
export async function getUbigeoCoordinates(
  districtCode?: string,
  provinceCode?: string,
  departmentCode?: string
): Promise<{ lat: number; lng: number } | null> {
  // Intentar obtener coords del distrito (más preciso)
  if (districtCode) {
    const data = getUbigeoData(districtCode);
    if (data?.lat && data?.lng) return { lat: data.lat, lng: data.lng };
  }
  // Fallback: primer distrito de la provincia
  if (provinceCode) {
    const districts = getDistricts(provinceCode);
    if (districts.length > 0) {
      const data = getUbigeoData(districts[0].code);
      if (data?.lat && data?.lng) return { lat: data.lat, lng: data.lng };
    }
  }
  // Fallback: primer distrito del primer provincia del departamento
  if (departmentCode) {
    const provinces = getProvinces(departmentCode);
    if (provinces.length > 0) {
      const districts = getDistricts(provinces[0].code);
      if (districts.length > 0) {
        const data = getUbigeoData(districts[0].code);
        if (data?.lat && data?.lng) return { lat: data.lat, lng: data.lng };
      }
    }
  }
  return null;
}

