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
 * Red de seguridad: reporta al fondo de capital la ganancia real (interés + mora,
 * recursivo sobre cadenas de negociación) de créditos STANDARD ya cerrados
 * (PAID_OFF) que se hayan quedado sin reportar — ver CreditInterestSyncService /
 * CreditInterestReporter en el backend.
 *
 * En el flujo normal esto no debería encontrar nada: el reporte ya se dispara solo
 * apenas un crédito cierra (CreditStatusRecalculator). Esto solo atrapa el caso raro
 * de que ese disparo automático se haya perdido (caída a mitad de proceso, bug,
 * datos históricos migrados sin el flag).
 */
export async function syncCreditInterestAction(): Promise<{ ok: boolean; message: string; creditsReported?: number }> {
  const res = await backendFetch('/api/v1/admin/credits/interest-sync', {
    method: 'POST',
    context: 'ADMIN_CREDIT_INTEREST_SYNC',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Error desconocido');
    return { ok: false, message: `Error ${res.status}: ${text}` };
  }

  const data = await res.json();
  const count: number = data.creditsReported ?? 0;
  return {
    ok: true,
    message: count > 0
      ? `${count} crédito${count === 1 ? '' : 's'} reportado${count === 1 ? '' : 's'} al fondo`
      : 'Todo al día — no había créditos pendientes de reportar',
    creditsReported: count,
  };
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
