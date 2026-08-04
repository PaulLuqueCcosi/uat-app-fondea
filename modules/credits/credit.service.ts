/**
 * Service de Créditos — conectado al backend real.
 *
 * Única puerta a los datos. Usa backendFetch para obtener datos,
 * mappers para transformarlos, y errors para los fallos.
 *
 * Los componentes NUNCA importan de aquí — solo las pages y actions.
 */

import type { Result } from '@/modules/shared/result';
import type {
  Credit,
  CreditSummary,
  Installment,
  NextPayment,
  Transaction,
  PaymentResult,
  RegisterPaymentRequest,
} from './credit.types';
import type { CreditError } from './credit.errors';
import { errors } from './credit.errors';
import { backendFetch } from '@/lib/backend-fetch';
import {
  mapCreditFromBackend,
  mapInstallmentFromBackend,
  mapCreditSummaryFromBackend,
  mapNextPaymentFromBackend,
  mapTransactionFromBackend,
  mapPaymentResultFromBackend,
} from './credit.mapper';

// Re-tipamos Result con nuestro error específico
type CreditResult<T> = Result<T> & (
  | { ok: true; data: T }
  | { ok: false; error: CreditError }
);

const CTX = 'CREDITS';

// ─── Créditos ─────────────────────────────────────────────────────────────────

/**
 * Lista todos los créditos del usuario (activos + liquidados).
 * GET /api/v1/credits
 */
export async function getCredits(): Promise<CreditResult<Credit[]>> {
  try {
    const res = await backendFetch('/api/v1/credits', { context: CTX });

    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    const credits = (raw.credits ?? []).map(mapCreditFromBackend);
    return { ok: true, data: credits };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

/**
 * Obtiene los créditos activos del usuario.
 *
 * Puede haber más de uno: el crédito natural (STANDARD) + créditos de
 * negociación (NEGOTIATION) abiertos para cuotas puntuales en mora.
 * Usar `credit.creditType` para distinguirlos en la UI.
 *
 * GET /api/v1/credits/active
 */
export async function getActiveCredits(): Promise<CreditResult<Credit[]>> {
  try {
    const res = await backendFetch('/api/v1/credits/active', { context: CTX });

    if (res.status === 404) return { ok: true, data: [] };
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    const credits = (raw.credits ?? []).map(mapCreditFromBackend);
    return { ok: true, data: credits };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

/**
 * Obtiene un crédito por ID.
 * GET /api/v1/credits/{id}
 */
export async function getCreditById(id: string): Promise<CreditResult<Credit>> {
  try {
    const res = await backendFetch(`/api/v1/credits/${id}`, { context: CTX });

    if (res.status === 404) return { ok: false, error: errors.creditNotFound(id) };
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    return { ok: true, data: mapCreditFromBackend(raw) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

// ─── Resumen ──────────────────────────────────────────────────────────────────

/**
 * Resumen de balances de un crédito.
 * GET /api/v1/credits/{id}/summary
 */
export async function getCreditSummary(creditId: string): Promise<CreditResult<CreditSummary>> {
  try {
    const res = await backendFetch(`/api/v1/credits/${creditId}/summary`, { context: CTX });

    if (res.status === 404) return { ok: false, error: errors.creditNotFound(creditId) };
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    return { ok: true, data: mapCreditSummaryFromBackend(raw) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

// ─── Cuotas ───────────────────────────────────────────────────────────────────

/**
 * Cronograma completo de cuotas de un crédito.
 * GET /api/v1/credits/{id}/installments
 */
export async function getInstallments(creditId: string): Promise<CreditResult<Installment[]>> {
  try {
    const res = await backendFetch(`/api/v1/credits/${creditId}/installments`, { context: CTX });

    if (res.status === 404) return { ok: false, error: errors.creditNotFound(creditId) };
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    const installments = (raw.installments ?? []).map(mapInstallmentFromBackend);
    return { ok: true, data: installments };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

/**
 * Detalle de una cuota específica.
 * GET /api/v1/credits/{id}/installments/{installmentNo}
 */
export async function getInstallmentByNo(
  creditId: string,
  installmentNo: number,
): Promise<CreditResult<Installment>> {
  try {
    const res = await backendFetch(
      `/api/v1/credits/${creditId}/installments/${installmentNo}`,
      { context: CTX },
    );

    if (res.status === 404) return { ok: false, error: errors.installmentNotFound(creditId, installmentNo) };
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    return { ok: true, data: mapInstallmentFromBackend(raw) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

// ─── Próximo pago ─────────────────────────────────────────────────────────────

/**
 * Próxima cuota a pagar.
 * GET /api/v1/credits/{id}/next-payment
 */
export async function getNextPayment(creditId: string): Promise<CreditResult<NextPayment | null>> {
  try {
    const res = await backendFetch(`/api/v1/credits/${creditId}/next-payment`, { context: CTX });

    if (res.status === 404) return { ok: true, data: null };
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    return { ok: true, data: mapNextPaymentFromBackend(raw) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

// ─── Transacciones ────────────────────────────────────────────────────────────

/**
 * Historial de transacciones de un crédito.
 * GET /api/v1/credits/{id}/transactions
 */
export async function getTransactions(creditId: string): Promise<CreditResult<Transaction[]>> {
  try {
    const res = await backendFetch(`/api/v1/credits/${creditId}/transactions`, { context: CTX });

    if (res.status === 404) return { ok: false, error: errors.creditNotFound(creditId) };
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    const transactions = (raw.transactions ?? []).map(mapTransactionFromBackend);
    return { ok: true, data: transactions };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

// ─── Pagar cuota ──────────────────────────────────────────────────────────────

/**
 * Registrar pago de una cuota específica.
 * POST /api/v1/credits/{id}/installments/{installmentNo}/pay
 */
export async function payInstallment(
  creditId: string,
  installmentNo: number,
  payment: RegisterPaymentRequest,
): Promise<CreditResult<PaymentResult>> {
  try {
    const res = await backendFetch(
      `/api/v1/credits/${creditId}/installments/${installmentNo}/pay`,
      {
        context: CTX,
        method: 'POST',
        body: JSON.stringify(payment),
      },
    );

    if (res.status === 400) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: errors.validationFailed(body.detail ?? body.message) };
    }
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status === 404) return { ok: false, error: errors.installmentNotFound(creditId, installmentNo) };
    if (res.status === 409) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: errors.conflict(body.detail ?? body.message) };
    }
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.paymentFailed() };

    const raw = await res.json();
    return { ok: true, data: mapPaymentResultFromBackend(raw) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}
