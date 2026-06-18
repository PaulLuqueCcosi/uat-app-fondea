'use server';

import { requireValidSession } from './auth.actions';
import * as applicationService from '@/modules/applications/application.service';
import { backendFetch } from '@/lib/backend-fetch';

/**
 * Obtiene todas las solicitudes del usuario.
 */
export async function getApplicationsList() {
  await requireValidSession();
  return applicationService.getApplications();
}

/**
 * TEMPORAL — Elimina una solicitud via admin endpoint.
 * DELETE /api/v1/admin/applications/{id}
 */
export async function deleteApplication(applicationId: string) {
  await requireValidSession();
  const res = await backendFetch(`/api/v1/admin/applications/${applicationId}`, {
    method: 'DELETE',
    context: 'APPLICATIONS',
  });
  return { ok: res.ok || res.status === 404 };
}
