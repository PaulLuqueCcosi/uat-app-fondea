'use server';

import { requireValidSession } from './auth.actions';
import { backendFetch } from '@/lib/backend-fetch';

/**
 * Regenera los contratos de una solicitud (admin).
 * Elimina los no firmados y genera nuevos con los templates activos actuales.
 * Solo funciona si la solicitud está en PRE_APPROVED.
 *
 * POST /api/v1/admin/applications/{applicationId}/contracts/regenerate
 */
export async function regenerateContractsAction(applicationId: string): Promise<{ ok: boolean; error?: string }> {
  await requireValidSession();

  try {
    const res = await backendFetch(`/api/v1/admin/applications/${applicationId}/contracts/regenerate`, {
      method: 'POST',
      context: 'ADMIN_REGENERATE_CONTRACT',
    });

    if (res.ok) {
      return { ok: true };
    }

    const body = await res.text().catch(() => '');
    console.error(`[ADMIN] Error regenerando contratos: ${res.status}`, body);
    return { ok: false, error: body || `Error HTTP ${res.status}` };
  } catch (err) {
    console.error('[ADMIN] Error regenerando contratos:', err);
    return { ok: false, error: 'Error de conexión' };
  }
}

// Nota: la URL del PDF de contrato y la URL de un documento (DNI/selfie) se piden
// vía API routes normales (app/api/admin/applications/[id]/contract/.../pdf y
// .../documents/.../url), NO Server Actions — invocar una Server Action desde el
// botón que las dispara chocaba con su propio setState local (loading) y tiraba
// "insertBefore ... not a child of this node" por el re-render de RSC que dispara
// toda Server Action al ser llamada desde un Client Component.
