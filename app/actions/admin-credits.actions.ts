'use server';

import { backendFetch } from '@/lib/backend-fetch';

/**
 * [DEV] Elimina un crédito y todo lo relacionado.
 * Solo funciona cuando el backend tiene el perfil "dev" activo.
 */
export async function deleteCreditAction(creditId: string): Promise<{ ok: boolean; message: string }> {
  const res = await backendFetch(`/api/v1/admin/dev/credits/${creditId}`, {
    method: 'DELETE',
    context: 'ADMIN_CREDIT_DELETE',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Error desconocido');
    return { ok: false, message: `Error ${res.status}: ${text}` };
  }

  const message = await res.text();
  return { ok: true, message };
}
