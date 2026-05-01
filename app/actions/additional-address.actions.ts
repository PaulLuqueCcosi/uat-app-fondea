'use server';

import { AddressProfile, AddressProfileStatus } from '@/lib/types';
import { requireValidSession } from './auth.actions';
import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

// Importar los datos locales de ubigeo
import departamentosData from '@/lib/ubigeo_departamentos.json';
import provinciasData from '@/lib/ubigeo_provincias.json';
import distritosData from '@/lib/ubigeo_distritos.json';

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

function toTitleCase(str: string): string {
  return str.toLowerCase().split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

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

// ── Perfil de dirección ───────────────────────────────────────────────────────

export async function getAddressProfileStatus(): Promise<AddressProfileStatus> {
  await requireValidSession();
  try {
    const res = await backendFetch('/api/v1/additional/status');
    if (!res.ok) return { profile: null, overall_verified: false };
    const json = await res.json();
    const profile: (AddressProfile & { verified: boolean }) | null = json.profile
      ? {
          address_type:    json.profile.address_type?.toLowerCase() as 'google' | 'manual' | undefined,
          google_address:  json.profile.google_address  ?? undefined,
          street_address:  json.profile.street_address  ?? undefined,
          region:          json.profile.region,
          province:        json.profile.province,
          district:        json.profile.district,
          referral_source: json.profile.referral_source,
          referral_other:  json.profile.referral_other  ?? undefined,
          verified:        json.profile.verified        ?? false,
        }
      : null;
    return { profile, overall_verified: json.overall_verified ?? false };
  } catch (error) {
    console.error('[ADDRESS] Error al obtener estado:', error);
    return { profile: null, overall_verified: false };
  }
}

export async function saveAddressProfile(
  data: Omit<AddressProfile, 'verified'>
): Promise<{ success: boolean; error?: string }> {
  await requireValidSession();
  try {
    const body: Record<string, unknown> = {
      address_type:    data.address_type?.toUpperCase() ?? 'MANUAL', // Backend espera GOOGLE/MANUAL en mayúsculas
      region:          data.region,
      province:        data.province,
      district:        data.district,
      referral_source: data.referral_source,
    };
    if (data.address_type === 'google') body.google_address = data.google_address;
    else if (data.address_type === 'manual') body.street_address = data.street_address;
    if (data.referral_source === 'OTRO') body.referral_other = data.referral_other;

    const res = await backendFetch('/api/v1/additional', { method: 'POST', body: JSON.stringify(body) });
    if (isSuccess(res.status)) return { success: true };
    return { success: false, error: await parseBackendError(res) };
  } catch (error) {
    console.error('[ADDRESS] Error al guardar:', error);
    return { success: false, error: 'Error de conexión.' };
  }
}

// ── Ubigeo (local JSON, sin backend) ─────────────────────────────────────────

export async function getDepartamentosAction(): Promise<UbigeoOption[]> {
  try {
    const data = departamentosData.ubigeo_departamentos;
    return data.map((d) => ({ value: d.ubigeo, label: toTitleCase(d.departamento) }))
               .sort((a, b) => a.label.localeCompare(b.label));
  } catch { return []; }
}

export async function getProvinciasAction(regionId: string): Promise<UbigeoOption[]> {
  if (!regionId) return [];
  try {
    // Buscar el departamento por ubigeo para obtener su ID interno
    const departamento = departamentosData.ubigeo_departamentos.find(d => d.ubigeo === regionId);
    if (!departamento) return [];
    
    // Filtrar provincias por departamento_id
    const data = provinciasData.ubigeo_provincias.filter(p => p.departamento_id === departamento.id);
    return data.map((p) => ({ value: p.ubigeo, label: toTitleCase(p.provincia) }))
               .sort((a, b) => a.label.localeCompare(b.label));
  } catch { return []; }
}

export async function getDistritosAction(provinceId: string): Promise<UbigeoOption[]> {
  if (!provinceId) return [];
  try {
    // Buscar la provincia por ubigeo para obtener su ID interno
    const provincia = provinciasData.ubigeo_provincias.find(p => p.ubigeo === provinceId);
    if (!provincia) return [];
    
    // Filtrar distritos por provincia_id
    const data = distritosData.ubigeo_distritos.filter(d => d.provincia_id === provincia.id);
    return data.map((d) => ({ value: d.ubigeo, label: toTitleCase(d.distrito) }))
               .sort((a, b) => a.label.localeCompare(b.label));
  } catch { return []; }
}

// ── Google Places (mock hasta tener API key) ──────────────────────────────────
// TODO: reemplazar con Google Places API cuando se configure GOOGLE_PLACES_API_KEY

const MOCK_SUGGESTIONS: AddressSuggestion[] = [
  { place_id: 'mock_1',  description: 'Av. Javier Prado Este 1234, San Isidro, Lima, Perú',   main_text: 'Av. Javier Prado Este 1234', secondary_text: 'San Isidro, Lima, Perú'        },
  { place_id: 'mock_2',  description: 'Av. Larco 456, Miraflores, Lima, Perú',                main_text: 'Av. Larco 456',              secondary_text: 'Miraflores, Lima, Perú'       },
  { place_id: 'mock_3',  description: 'Jr. de la Unión 789, Cercado de Lima, Lima, Perú',     main_text: 'Jr. de la Unión 789',        secondary_text: 'Cercado de Lima, Lima, Perú'  },
  { place_id: 'mock_4',  description: 'Calle Los Pinos 321, Santiago de Surco, Lima, Perú',   main_text: 'Calle Los Pinos 321',        secondary_text: 'Santiago de Surco, Lima, Perú'},
  { place_id: 'mock_5',  description: 'Av. Arequipa 2500, Lince, Lima, Perú',                 main_text: 'Av. Arequipa 2500',          secondary_text: 'Lince, Lima, Perú'            },
  { place_id: 'mock_6',  description: 'Av. Ejército 1100, Miraflores, Lima, Perú',            main_text: 'Av. Ejército 1100',          secondary_text: 'Miraflores, Lima, Perú'       },
  { place_id: 'mock_7',  description: 'Calle Schell 130, Miraflores, Lima, Perú',             main_text: 'Calle Schell 130',           secondary_text: 'Miraflores, Lima, Perú'       },
  { place_id: 'mock_8',  description: 'Av. Benavides 3456, Santiago de Surco, Lima, Perú',    main_text: 'Av. Benavides 3456',         secondary_text: 'Santiago de Surco, Lima, Perú'},
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
  await new Promise((r) => setTimeout(r, 300));
  const q = query.toLowerCase();
  return MOCK_SUGGESTIONS.filter(
    (s) => s.description.toLowerCase().includes(q) || s.main_text.toLowerCase().includes(q)
  ).slice(0, 5);
}

export async function getAddressDetailAction(placeId: string): Promise<AddressDetail | null> {
  await new Promise((r) => setTimeout(r, 200));
  return MOCK_DETAILS[placeId] ?? null;
}
