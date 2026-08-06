/**
 * Service para el calendario de feriados del Libro de Reclamaciones — admin.
 * Endpoints:
 * - GET    /api/v1/admin/complaint-holidays
 * - POST   /api/v1/admin/complaint-holidays
 * - DELETE /api/v1/admin/complaint-holidays/{id}
 */

import { backendFetch } from '@/lib/backend-fetch';
import type { AdminHoliday, AddHolidayRequest } from './admin-complaint-holidays.types';

export async function getAdminComplaintHolidays(): Promise<AdminHoliday[]> {
  const res = await backendFetch('/api/v1/admin/complaint-holidays', {
    context: 'ADMIN_COMPLAINT_HOLIDAYS',
  });

  if (!res.ok) {
    console.error(`[ADMIN_COMPLAINT_HOLIDAYS] Error ${res.status} al listar feriados`);
    return [];
  }

  return res.json();
}

export async function addAdminComplaintHoliday(
  request: AddHolidayRequest,
): Promise<{ ok: boolean; data?: AdminHoliday; message?: string }> {
  const res = await backendFetch('/api/v1/admin/complaint-holidays', {
    method: 'POST',
    context: 'ADMIN_COMPLAINT_HOLIDAYS',
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[ADMIN_COMPLAINT_HOLIDAYS] Error ${res.status} al agregar feriado: ${body}`);
    return { ok: false, message: `Error al agregar feriado: ${res.status}` };
  }

  return { ok: true, data: await res.json() };
}

export async function removeAdminComplaintHoliday(id: string): Promise<{ ok: boolean; message?: string }> {
  const res = await backendFetch(`/api/v1/admin/complaint-holidays/${id}`, {
    method: 'DELETE',
    context: 'ADMIN_COMPLAINT_HOLIDAYS',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[ADMIN_COMPLAINT_HOLIDAYS] Error ${res.status} al quitar feriado: ${body}`);
    return { ok: false, message: `Error al quitar feriado: ${res.status}` };
  }

  return { ok: true };
}
