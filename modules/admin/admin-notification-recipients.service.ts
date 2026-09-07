/**
 * Service para los correos que reciben alertas operativas — admin.
 * Endpoints:
 * - GET    /api/v1/admin/notifications/alert-recipients
 * - POST   /api/v1/admin/notifications/alert-recipients
 * - PATCH  /api/v1/admin/notifications/alert-recipients/{id}
 * - DELETE /api/v1/admin/notifications/alert-recipients/{id}
 */

import { backendFetch } from '@/lib/backend-fetch';
import type { AdminAlertRecipient, AddAdminAlertRecipientRequest } from './admin-notification-recipients.types';

const CTX = 'ADMIN_NOTIFICATION_RECIPIENTS';

export async function getAdminAlertRecipients(): Promise<AdminAlertRecipient[]> {
  const res = await backendFetch('/api/v1/admin/notifications/alert-recipients', { context: CTX });

  if (!res.ok) {
    console.error(`[${CTX}] Error ${res.status} al listar destinatarios`);
    return [];
  }

  return res.json();
}

export async function addAdminAlertRecipient(
  request: AddAdminAlertRecipientRequest,
): Promise<{ ok: boolean; data?: AdminAlertRecipient; message?: string }> {
  const res = await backendFetch('/api/v1/admin/notifications/alert-recipients', {
    method: 'POST',
    context: CTX,
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, message: body.detail ?? body.message ?? `Error al agregar destinatario: ${res.status}` };
  }

  return { ok: true, data: await res.json() };
}

export async function setAdminAlertRecipientActive(
  id: string,
  active: boolean,
): Promise<{ ok: boolean; data?: AdminAlertRecipient; message?: string }> {
  const res = await backendFetch(`/api/v1/admin/notifications/alert-recipients/${id}`, {
    method: 'PATCH',
    context: CTX,
    body: JSON.stringify({ active }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[${CTX}] Error ${res.status} al actualizar destinatario: ${body}`);
    return { ok: false, message: `Error al actualizar destinatario: ${res.status}` };
  }

  return { ok: true, data: await res.json() };
}

export async function removeAdminAlertRecipient(id: string): Promise<{ ok: boolean; message?: string }> {
  const res = await backendFetch(`/api/v1/admin/notifications/alert-recipients/${id}`, {
    method: 'DELETE',
    context: CTX,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[${CTX}] Error ${res.status} al quitar destinatario: ${body}`);
    return { ok: false, message: `Error al quitar destinatario: ${res.status}` };
  }

  return { ok: true };
}
