/**
 * Service para obtener el detalle completo de una solicitud (admin).
 * Reutiliza el endpoint de ciclo de vida que ya incluye todo.
 */

import { backendFetch } from '@/lib/backend-fetch';
import type { ApplicationLifecycle } from './admin-lifecycle.service';
export type { ApplicationLifecycle } from './admin-lifecycle.service';

export async function getApplicationDetail(id: string): Promise<ApplicationLifecycle | null> {
  const res = await backendFetch(`/api/v1/admin/applications/${id}/lifecycle`, {
    context: 'ADMIN_APPLICATION_DETAIL',
  });

  if (!res.ok) {
    console.error(`[ADMIN_APPLICATION_DETAIL] Error ${res.status}`);
    return null;
  }

  return res.json();
}
