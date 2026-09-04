/**
 * Service para ciudades activas/pausadas y horario de aceptación de solicitudes (M1 #58).
 * Endpoints:
 * - GET  /api/v1/admin/availability/cities
 * - POST /api/v1/admin/availability/cities
 * - PUT  /api/v1/admin/availability/cities/{id}/pause
 * - PUT  /api/v1/admin/availability/cities/{id}/activate
 * - GET  /api/v1/admin/availability/business-hours
 * - PUT  /api/v1/admin/availability/business-hours
 */

import { backendFetch } from '@/lib/backend-fetch';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminCityAvailability {
  id: string;
  ubigeoProvinceCode: string;
  cityName: string;
  active: boolean;
  pausedReason: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface CreateCityAvailabilityRequest {
  ubigeoProvinceCode: string;
  cityName: string;
}

export interface AdminBusinessHours {
  id: string;
  openTime: string; // "08:00:00"
  closeTime: string; // "20:00:00"
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface UpdateBusinessHoursRequest {
  openTime: string;
  closeTime: string;
}

export type CityAvailabilityResult =
  | { ok: true; data: AdminCityAvailability }
  | { ok: false; error: string };

export type BusinessHoursResult =
  | { ok: true; data: AdminBusinessHours }
  | { ok: false; error: string };

// ── Mappers snake_case → camelCase ──────────────────────────────────────────

function mapCity(raw: any): AdminCityAvailability {
  return {
    id: raw.id,
    ubigeoProvinceCode: raw.ubigeo_province_code,
    cityName: raw.city_name,
    active: raw.active,
    pausedReason: raw.paused_reason ?? null,
    updatedBy: raw.updated_by ?? null,
    updatedAt: raw.updated_at ?? null,
  };
}

function mapBusinessHours(raw: any): AdminBusinessHours {
  return {
    id: raw.id,
    openTime: raw.open_time,
    closeTime: raw.close_time,
    updatedBy: raw.updated_by ?? null,
    updatedAt: raw.updated_at ?? null,
  };
}

async function extractErrorDetail(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body?.detail ?? body?.message ?? fallback;
  } catch {
    return fallback;
  }
}

// ── Ciudades ─────────────────────────────────────────────────────────────────

export async function getAdminCities(): Promise<AdminCityAvailability[]> {
  const res = await backendFetch('/api/v1/admin/availability/cities', {
    context: 'ADMIN_AVAILABILITY',
  });

  if (!res.ok) {
    console.error(`[ADMIN_AVAILABILITY] Error ${res.status} al listar ciudades`);
    return [];
  }

  const data = await res.json();
  return data.map(mapCity);
}

export async function createAdminCity(request: CreateCityAvailabilityRequest): Promise<CityAvailabilityResult> {
  const res = await backendFetch('/api/v1/admin/availability/cities', {
    context: 'ADMIN_AVAILABILITY',
    method: 'POST',
    body: JSON.stringify({
      ubigeo_province_code: request.ubigeoProvinceCode,
      city_name: request.cityName,
    }),
  });

  if (!res.ok) {
    const error = await extractErrorDetail(res, `Error al registrar la ciudad: ${res.status}`);
    console.error(`[ADMIN_AVAILABILITY] Error ${res.status} al crear ciudad: ${error}`);
    return { ok: false, error };
  }

  return { ok: true, data: mapCity(await res.json()) };
}

export async function pauseAdminCity(id: string, reason?: string): Promise<CityAvailabilityResult> {
  const res = await backendFetch(`/api/v1/admin/availability/cities/${id}/pause`, {
    context: 'ADMIN_AVAILABILITY',
    method: 'PUT',
    body: JSON.stringify({ reason: reason ?? null }),
  });

  if (!res.ok) {
    const error = await extractErrorDetail(res, `Error al pausar la ciudad: ${res.status}`);
    console.error(`[ADMIN_AVAILABILITY] Error ${res.status} al pausar ciudad ${id}: ${error}`);
    return { ok: false, error };
  }

  return { ok: true, data: mapCity(await res.json()) };
}

export async function activateAdminCity(id: string): Promise<CityAvailabilityResult> {
  const res = await backendFetch(`/api/v1/admin/availability/cities/${id}/activate`, {
    context: 'ADMIN_AVAILABILITY',
    method: 'PUT',
  });

  if (!res.ok) {
    const error = await extractErrorDetail(res, `Error al reactivar la ciudad: ${res.status}`);
    console.error(`[ADMIN_AVAILABILITY] Error ${res.status} al reactivar ciudad ${id}: ${error}`);
    return { ok: false, error };
  }

  return { ok: true, data: mapCity(await res.json()) };
}

// ── Horario ──────────────────────────────────────────────────────────────────

export async function getAdminBusinessHours(): Promise<AdminBusinessHours | null> {
  const res = await backendFetch('/api/v1/admin/availability/business-hours', {
    context: 'ADMIN_AVAILABILITY',
  });

  if (!res.ok) {
    console.error(`[ADMIN_AVAILABILITY] Error ${res.status} al obtener horario`);
    return null;
  }

  return mapBusinessHours(await res.json());
}

export async function updateAdminBusinessHours(request: UpdateBusinessHoursRequest): Promise<BusinessHoursResult> {
  const res = await backendFetch('/api/v1/admin/availability/business-hours', {
    context: 'ADMIN_AVAILABILITY',
    method: 'PUT',
    body: JSON.stringify({
      open_time: request.openTime,
      close_time: request.closeTime,
    }),
  });

  if (!res.ok) {
    const error = await extractErrorDetail(res, `Error al actualizar el horario: ${res.status}`);
    console.error(`[ADMIN_AVAILABILITY] Error ${res.status} al actualizar horario: ${error}`);
    return { ok: false, error };
  }

  return { ok: true, data: mapBusinessHours(await res.json()) };
}
