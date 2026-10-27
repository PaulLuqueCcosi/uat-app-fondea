'use server';

import { backendFetch } from '@/lib/backend-fetch';
import {
  suspendCredit,
  reactivateCredit,
  writeOffCredit,
} from '@/modules/admin/admin-credit-detail.service';

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

// ── Operaciones de estado manual (suspender / reactivar / castigar) ─────────
//
// Operaciones críticas y poco frecuentes — se ejecutan SOLO desde la vista de
// detalle de un crédito (/admin/credits/[id]), nunca en bulk desde la tabla.
// Cada una queda registrada en el timeline de auditoría del crédito con el
// admin que la ejecutó (ver CreditAdminOperationsService en el backend).

/** Suspende un crédito. Requiere motivo — el backend rechaza reason vacío con 400. */
export async function suspendCreditAction(creditId: string, reason: string) {
  return suspendCredit(creditId, reason);
}

/** Reactiva un crédito suspendido. Solo válido si el crédito está en SUSPENDED. */
export async function reactivateCreditAction(creditId: string) {
  return reactivateCredit(creditId);
}

/**
 * Castiga un crédito (WRITTEN_OFF). Solo válido desde OVERDUE. Reporta la pérdida
 * al fondo de capital automáticamente — si el crédito se recupera después, ese
 * ajuste NO se revierte solo, requiere un movimiento manual en /admin/fund.
 */
export async function writeOffCreditAction(creditId: string, writtenOffDate?: string) {
  return writeOffCredit(creditId, writtenOffDate);
}

export type ManualPaymentMethod = 'BANK_TRANSFER' | 'YAPE' | 'PLIN' | 'CASH' | 'OTHER';

export interface RegisterManualPaymentInput {
  amount: number;
  paymentMethod: ManualPaymentMethod;
  referenceNumber?: string;
  /** Fecha contable AAAA-MM-DD; vacío = hoy. */
  transactionDate?: string;
}

export interface RegisterManualPaymentResult {
  ok: boolean;
  message: string;
  totalApplied?: number;
  remaining?: number;
}

/**
 * Registra un pago hecho fuera de la plataforma (ventanilla, transferencia directa) apuntando
 * a una cuota. El backend aplica mora → interés → capital en orden sobre las cuotas cobrables
 * hasta la cuota objetivo y nunca cobra cuotas posteriores.
 * POST /api/v1/admin/credits/{id}/installments/{n}/payments
 */
export async function registerManualPaymentAction(
  creditId: string,
  installmentNo: number,
  input: RegisterManualPaymentInput,
): Promise<RegisterManualPaymentResult> {
  const res = await backendFetch(`/api/v1/admin/credits/${creditId}/installments/${installmentNo}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      referenceNumber: input.referenceNumber?.trim() || null,
      transactionDate: input.transactionDate || null,
      source: 'manual',
    }),
    context: 'ADMIN_CREDIT_MANUAL_PAYMENT',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return { ok: false, message: body?.detail ?? body?.message ?? `No se pudo registrar el pago (error ${res.status})` };
  }

  const data = await res.json();
  return { ok: true, message: 'Pago registrado', totalApplied: data.total_applied, remaining: data.remaining };
}

/**
 * URL prefirmada del contrato firmado de un crédito (null si no tiene uno firmado).
 * GET /api/v1/admin/portfolio/credits/{creditId}/contract
 */
export async function getCreditContractUrlAction(creditId: string): Promise<{ ok: boolean; url?: string; message?: string }> {
  const res = await backendFetch(`/api/v1/admin/portfolio/credits/${creditId}/contract`, {
    context: 'ADMIN_CREDIT_CONTRACT',
  });

  if (res.status === 404) return { ok: false, message: 'Este crédito no tiene un contrato firmado disponible.' };
  if (!res.ok) return { ok: false, message: `No se pudo obtener el contrato (error ${res.status})` };

  const data = await res.json();
  return data.url ? { ok: true, url: data.url } : { ok: false, message: 'No se pudo obtener el contrato.' };
}
