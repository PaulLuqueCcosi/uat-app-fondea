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

export interface AddressSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

export interface AddressDetail {
  place_id: string;
  formatted_address: string;
  street: string;
  google_district:   string;
  google_province:   string;
  google_department: string;
  matched_departamento_id:   string | null;
  matched_departamento_name: string | null;
  matched_provincia_id:      string | null;
  matched_provincia_name:    string | null;
  matched_distrito_id:       string | null;
  matched_distrito_name:     string | null;
  lat?: number;
  lng?: number;
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
    address_type:    addressType === 'google' || addressType === 'manual' ? addressType : 'manual',
    google_address:  raw.googleAddress ?? raw.google_address ?? undefined,
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
    const editMetadata = getEditMetadata('address', verified);

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
      address_type:    data.address_type?.toUpperCase() ?? 'MANUAL',
      region:          data.region,
      province:        data.province,
      district:        data.district,
      referral_source: data.referral_source,
      referral_other:  data.referral_source === 'OTRO' ? (data.referral_other ?? '') : null,
    };
    if (data.address_type === 'google') body.google_address = data.google_address;
    else if (data.address_type === 'manual') body.street_address = data.street_address;
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

// ── Google Places ─────────────────────────────────────────────────────────────
// TODO: reemplazar con Google Places API cuando se configure GOOGLE_PLACES_API_KEY
//       endpoint sugerido: GET /api/v1/address/search?q={query}
//                          GET /api/v1/address/detail/{placeId}

const MOCK_SUGGESTIONS: AddressSuggestion[] = [
  { place_id: 'mock_1',  description: 'Av. Javier Prado Este 1234, San Isidro, Lima, Perú',   main_text: 'Av. Javier Prado Este 1234', secondary_text: 'San Isidro, Lima, Perú'        },
  { place_id: 'mock_2',  description: 'Av. Larco 456, Miraflores, Lima, Perú',                main_text: 'Av. Larco 456',              secondary_text: 'Miraflores, Lima, Perú'       },
  { place_id: 'mock_3',  description: 'Jr. de la Unión 789, Cercado de Lima, Lima, Perú',     main_text: 'Jr. de la Unión 789',        secondary_text: 'Cercado de Lima, Lima, Perú'  },
  { place_id: 'mock_4',  description: 'Calle Los Pinos 321, Santiago de Surco, Lima, Perú',   main_text: 'Calle Los Pinos 321',        secondary_text: 'Santiago de Surco, Lima, Perú'},
  { place_id: 'mock_5',  description: 'Av. Arequipa 2500, Lince, Lima, Perú',                 main_text: 'Av. Arequipa 2500',          secondary_text: 'Lince, Lima, Perú'            },
  { place_id: 'mock_6',  description: 'Av. Ejército 1100, Miraflores, Lima, Perú',            main_text: 'Av. Ejército 1100',          secondary_text: 'Miraflores, Lima, Perú'       },
  { place_id: 'mock_7',  description: 'Calle Schell 130, Miraflores, Lima, Perú',             main_text: 'Calle Schell 130',           secondary_text: 'Miraflores, Lima, Perú'       },
  { place_id: 'mock_8',  description: 'Av. Benavides 3456, Santiago de Surco, Lima, Perú',   main_text: 'Av. Benavides 3456',         secondary_text: 'Santiago de Surco, Lima, Perú'},
  { place_id: 'mock_9',  description: 'Av. Pardo 640, Miraflores, Lima, Perú',                main_text: 'Av. Pardo 640',              secondary_text: 'Miraflores, Lima, Perú'       },
  { place_id: 'mock_10', description: 'Calle Independencia 200, Arequipa, Arequipa, Perú',    main_text: 'Calle Independencia 200',    secondary_text: 'Arequipa, Arequipa, Perú'     },
  { place_id: 'mock_11', description: 'Av. El Sol 123, Cusco, Cusco, Perú',                   main_text: 'Av. El Sol 123',             secondary_text: 'Cusco, Cusco, Perú'           },
  { place_id: 'mock_12', description: 'Jr. Puno 456, Trujillo, La Libertad, Perú',            main_text: 'Jr. Puno 456',               secondary_text: 'Trujillo, La Libertad, Perú'  },
];

const MOCK_DETAILS: Record<string, AddressDetail> = {
  mock_1:  { place_id: 'mock_1',  formatted_address: 'Av. Javier Prado Este 1234, San Isidro, Lima, Perú',  street: 'Av. Javier Prado Este 1234', google_district: 'San Isidro',        google_province: 'Lima',     google_department: 'Lima',        matched_departamento_id: '15', matched_departamento_name: 'LIMA',        matched_provincia_id: '1501', matched_provincia_name: 'LIMA',     matched_distrito_id: '150131', matched_distrito_name: 'SAN ISIDRO',        lat: -12.0931, lng: -77.0197 },
  mock_2:  { place_id: 'mock_2',  formatted_address: 'Av. Larco 456, Miraflores, Lima, Perú',               street: 'Av. Larco 456',              google_district: 'Miraflores',        google_province: 'Lima',     google_department: 'Lima',        matched_departamento_id: '15', matched_departamento_name: 'LIMA',        matched_provincia_id: '1501', matched_provincia_name: 'LIMA',     matched_distrito_id: '150122', matched_distrito_name: 'MIRAFLORES',        lat: -12.1219, lng: -77.0297 },
  mock_3:  { place_id: 'mock_3',  formatted_address: 'Jr. de la Unión 789, Cercado de Lima, Lima, Perú',    street: 'Jr. de la Unión 789',        google_district: 'Cercado de Lima',   google_province: 'Lima',     google_department: 'Lima',        matched_departamento_id: '15', matched_departamento_name: 'LIMA',        matched_provincia_id: '1501', matched_provincia_name: 'LIMA',     matched_distrito_id: '150101', matched_distrito_name: 'LIMA',              lat: -12.0464, lng: -77.0428 },
  mock_4:  { place_id: 'mock_4',  formatted_address: 'Calle Los Pinos 321, Santiago de Surco, Lima, Perú',  street: 'Calle Los Pinos 321',        google_district: 'Santiago de Surco', google_province: 'Lima',     google_department: 'Lima',        matched_departamento_id: '15', matched_departamento_name: 'LIMA',        matched_provincia_id: '1501', matched_provincia_name: 'LIMA',     matched_distrito_id: '150140', matched_distrito_name: 'SANTIAGO DE SURCO', lat: -12.1500, lng: -76.9900 },
  mock_5:  { place_id: 'mock_5',  formatted_address: 'Av. Arequipa 2500, Lince, Lima, Perú',                street: 'Av. Arequipa 2500',          google_district: 'Lince',             google_province: 'Lima',     google_department: 'Lima',        matched_departamento_id: '15', matched_departamento_name: 'LIMA',        matched_provincia_id: '1501', matched_provincia_name: 'LIMA',     matched_distrito_id: '150117', matched_distrito_name: 'LINCE',             lat: -12.0800, lng: -77.0350 },
  mock_6:  { place_id: 'mock_6',  formatted_address: 'Av. Ejército 1100, Miraflores, Lima, Perú',           street: 'Av. Ejército 1100',          google_district: 'Miraflores',        google_province: 'Lima',     google_department: 'Lima',        matched_departamento_id: '15', matched_departamento_name: 'LIMA',        matched_provincia_id: '1501', matched_provincia_name: 'LIMA',     matched_distrito_id: '150122', matched_distrito_name: 'MIRAFLORES',        lat: -12.1100, lng: -77.0450 },
  mock_7:  { place_id: 'mock_7',  formatted_address: 'Calle Schell 130, Miraflores, Lima, Perú',            street: 'Calle Schell 130',           google_district: 'Miraflores',        google_province: 'Lima',     google_department: 'Lima',        matched_departamento_id: '15', matched_departamento_name: 'LIMA',        matched_provincia_id: '1501', matched_provincia_name: 'LIMA',     matched_distrito_id: '150122', matched_distrito_name: 'MIRAFLORES',        lat: -12.1180, lng: -77.0290 },
  mock_8:  { place_id: 'mock_8',  formatted_address: 'Av. Benavides 3456, Santiago de Surco, Lima, Perú',   street: 'Av. Benavides 3456',         google_district: 'Santiago de Surco', google_province: 'Lima',     google_department: 'Lima',        matched_departamento_id: '15', matched_departamento_name: 'LIMA',        matched_provincia_id: '1501', matched_provincia_name: 'LIMA',     matched_distrito_id: '150140', matched_distrito_name: 'SANTIAGO DE SURCO', lat: -12.1350, lng: -76.9980 },
  mock_9:  { place_id: 'mock_9',  formatted_address: 'Av. Pardo 640, Miraflores, Lima, Perú',               street: 'Av. Pardo 640',              google_district: 'Miraflores',        google_province: 'Lima',     google_department: 'Lima',        matched_departamento_id: '15', matched_departamento_name: 'LIMA',        matched_provincia_id: '1501', matched_provincia_name: 'LIMA',     matched_distrito_id: '150122', matched_distrito_name: 'MIRAFLORES',        lat: -12.1200, lng: -77.0280 },
  mock_10: { place_id: 'mock_10', formatted_address: 'Calle Independencia 200, Arequipa, Arequipa, Perú',   street: 'Calle Independencia 200',    google_district: 'Arequipa',          google_province: 'Arequipa', google_department: 'Arequipa',    matched_departamento_id: '04', matched_departamento_name: 'AREQUIPA',    matched_provincia_id: '0401', matched_provincia_name: 'AREQUIPA', matched_distrito_id: '040101', matched_distrito_name: 'AREQUIPA',          lat: -16.4090, lng: -71.5375 },
  mock_11: { place_id: 'mock_11', formatted_address: 'Av. El Sol 123, Cusco, Cusco, Perú',                  street: 'Av. El Sol 123',             google_district: 'Cusco',             google_province: 'Cusco',    google_department: 'Cusco',       matched_departamento_id: '08', matched_departamento_name: 'CUSCO',       matched_provincia_id: '0801', matched_provincia_name: 'CUSCO',    matched_distrito_id: '080101', matched_distrito_name: 'CUSCO',             lat: -13.5319, lng: -71.9675 },
  mock_12: { place_id: 'mock_12', formatted_address: 'Jr. Puno 456, Trujillo, La Libertad, Perú',           street: 'Jr. Puno 456',               google_district: 'Trujillo',          google_province: 'Trujillo', google_department: 'La Libertad', matched_departamento_id: '13', matched_departamento_name: 'LA LIBERTAD', matched_provincia_id: '1301', matched_provincia_name: 'TRUJILLO', matched_distrito_id: '130101', matched_distrito_name: 'TRUJILLO',          lat: -8.1116,  lng: -79.0288 },
};

export async function searchAddressAction(query: string): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) return [];
  const q = query.toLowerCase();
  return MOCK_SUGGESTIONS.filter(
    (s) => s.description.toLowerCase().includes(q) || s.main_text.toLowerCase().includes(q)
  ).slice(0, 5);
}

export async function getAddressDetailAction(placeId: string): Promise<AddressDetail | null> {
  return MOCK_DETAILS[placeId] ?? null;
}
