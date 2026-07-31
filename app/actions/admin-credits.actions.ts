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

/**
 * Reintenta la creación del crédito (Fase 2) para una solicitud APPROVED cuyo
 * creditCreationStatus quedó en FAILED. Idempotente: si el crédito ya existe,
 * el backend lo detecta y no duplica.
 */
export async function retryCreditCreationAction(
  applicationId: string,
): Promise<{ ok: boolean; message: string; creditId?: string }> {
  const res = await backendFetch(`/api/v1/admin/credits/create-from-application/${applicationId}`, {
    method: 'POST',
    context: 'ADMIN_CREDIT_RETRY',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Error desconocido');
    return { ok: false, message: `Error ${res.status}: ${text}` };
  }

  const data = await res.json();
  return {
    ok: true,
    message: data.already_exists
      ? 'El crédito ya existía — no se duplicó'
      : (data.message ?? 'Crédito creado correctamente'),
    creditId: data.credit_id ?? undefined,
  };
}
