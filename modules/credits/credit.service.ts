/**
 * Service de Créditos — la ÚNICA puerta a los datos de este módulo.
 *
 * HOY: retorna mock data local.
 * MAÑANA: backendFetch a los endpoints reales.
 *
 * Retorna Result<T> con errores tipados.
 * Los componentes NUNCA importan de aquí — solo las pages y actions.
 */

import type { Result } from '@/modules/shared/result';
import type {
  Credit,
  CreditsSummary,
  InstallmentDetail,
  PaymentRecord,
} from './credit.types';
import type { CreditError } from './credit.errors';
import { errors } from './credit.errors';
import { mockCredits, mockInstallmentDetails, mockPayments } from './credit.data';
// import { backendFetch } from '@/lib/backend-fetch';
// import { mapCreditFromBackend, mapInstallmentDetailFromBackend, mapPaymentFromBackend } from './credit.mapper';

// Re-tipamos Result con nuestro error específico
type CreditResult<T> = Result<T> & (
  | { ok: true; data: T }
  | { ok: false; error: CreditError }
);

// ─── Créditos ─────────────────────────────────────────────────────────────────

/**
 * Obtiene todos los créditos del usuario autenticado.
 *
 * TODO: Reemplazar por:
 *   const res = await backendFetch('/api/v1/credits', { context: 'CREDITS' });
 */
export async function getCredits(): Promise<CreditResult<Credit[]>> {
  try {
    // TODO: backendFetch + mapCreditFromBackend
    const data = mockCredits;

    if (data.length === 0) {
      return { ok: true, data: [] };
    }

    return { ok: true, data };
  } catch (err) {
    console.error('[CREDITS] getCredits → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}

/**
 * Obtiene un crédito por ID.
 *
 * TODO: Reemplazar por:
 *   const res = await backendFetch(`/api/v1/credits/${id}`, { context: 'CREDITS' });
 */
export async function getCreditById(id: string): Promise<CreditResult<Credit>> {
  try {
    // TODO: backendFetch + mapCreditFromBackend
    const found = mockCredits.find((c) => c.id === id);

    if (!found) {
      return { ok: false, error: errors.creditNotFound(id) };
    }

    return { ok: true, data: found };
  } catch (err) {
    console.error('[CREDITS] getCreditById → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}

/**
 * Obtiene solo los créditos activos (para el dashboard).
 */
export async function getActiveCredits(): Promise<CreditResult<Credit[]>> {
  try {
    const data = mockCredits.filter((c) => c.status === 'ACTIVE');
    return { ok: true, data };
  } catch (err) {
    console.error('[CREDITS] getActiveCredits → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}

// ─── Resumen ──────────────────────────────────────────────────────────────────

/**
 * Obtiene el resumen agregado de créditos del usuario.
 *
 * TODO: Reemplazar por:
 *   const res = await backendFetch('/api/v1/credits/summary', { context: 'CREDITS' });
 */
export async function getCreditsSummary(): Promise<CreditResult<CreditsSummary>> {
  try {
    // TODO: backendFetch + mapCreditsSummaryFromBackend
    const credits = mockCredits;
    const summary: CreditsSummary = {
      activeCount: credits.filter((c) => c.status === 'ACTIVE').length,
      completedCount: credits.filter((c) => c.status === 'COMPLETED').length,
      overdueCount: credits.filter((c) => c.status === 'OVERDUE').length,
      totalPendingBalance: credits.reduce((sum, c) => sum + c.pendingBalance, 0),
      totalPaidAmount: credits.reduce((sum, c) => sum + c.paidAmount, 0),
    };

    return { ok: true, data: summary };
  } catch (err) {
    console.error('[CREDITS] getCreditsSummary → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}

// ─── Cuotas ───────────────────────────────────────────────────────────────────

/**
 * Obtiene el detalle de todas las cuotas de un crédito.
 *
 * TODO: Reemplazar por:
 *   const res = await backendFetch(`/api/v1/credits/${creditId}/installments`, { context: 'CREDITS' });
 */
export async function getInstallmentsByCreditId(
  creditId: string,
): Promise<CreditResult<InstallmentDetail[]>> {
  try {
    // TODO: backendFetch + mapInstallmentDetailFromBackend
    const details = mockInstallmentDetails.filter((d) => d.creditId === creditId);
    return { ok: true, data: details };
  } catch (err) {
    console.error('[CREDITS] getInstallmentsByCreditId → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}

/**
 * Obtiene el detalle de una cuota específica.
 *
 * TODO: Reemplazar por:
 *   const res = await backendFetch(`/api/v1/installments/${installmentId}`, { context: 'CREDITS' });
 */
export async function getInstallmentDetail(
  installmentId: string,
): Promise<CreditResult<InstallmentDetail>> {
  try {
    // TODO: backendFetch + mapInstallmentDetailFromBackend
    const found = mockInstallmentDetails.find((d) => d.id === installmentId);

    if (!found) {
      return { ok: false, error: errors.installmentNotFound(installmentId) };
    }

    return { ok: true, data: found };
  } catch (err) {
    console.error('[CREDITS] getInstallmentDetail → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}

// ─── Pagos ────────────────────────────────────────────────────────────────────

/**
 * Obtiene el historial de pagos del usuario.
 *
 * TODO: Reemplazar por:
 *   const res = await backendFetch('/api/v1/payments', { context: 'CREDITS' });
 */
export async function getPaymentHistory(): Promise<CreditResult<PaymentRecord[]>> {
  try {
    // TODO: backendFetch + mapPaymentFromBackend
    return { ok: true, data: mockPayments };
  } catch (err) {
    console.error('[CREDITS] getPaymentHistory → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}

/**
 * Obtiene pagos de un crédito específico.
 */
export async function getPaymentsByCreditId(
  creditId: string,
): Promise<CreditResult<PaymentRecord[]>> {
  try {
    const payments = mockPayments.filter((p) => p.creditId === creditId);
    return { ok: true, data: payments };
  } catch (err) {
    console.error('[CREDITS] getPaymentsByCreditId → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}

// ─── Cuota a pagar (next due) ─────────────────────────────────────────────────

/**
 * Obtiene la cuota que el usuario debe pagar ahora.
 *
 * Prioridad (definida por el backend):
 *   1. OVERDUE (vencida) — la más urgente
 *   2. PENDING (próxima a vencer)
 *   3. null — no hay cuotas pendientes
 *
 * TODO: Reemplazar por:
 *   const res = await backendFetch(`/api/v1/credits/${creditId}/next-installment`, { context: 'CREDITS' });
 *   El backend debe resolver esta lógica (no el frontend).
 */
export async function getNextDueInstallment(
  creditId: string,
): Promise<CreditResult<InstallmentDetail | null>> {
  try {
    // TODO: backendFetch — un solo endpoint que devuelve la cuota que toca pagar
    const details = mockInstallmentDetails.filter((d) => d.creditId === creditId);

    // Prioridad: OVERDUE primero (la más antigua), luego PENDING (la más próxima)
    const overdue = details
      .filter((d) => d.status === 'OVERDUE')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    if (overdue.length > 0) {
      return { ok: true, data: overdue[0] };
    }

    const pending = details
      .filter((d) => d.status === 'PENDING')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    if (pending.length > 0) {
      return { ok: true, data: pending[0] };
    }

    // No hay cuotas pendientes (crédito completado o todas futuras)
    return { ok: true, data: null };
  } catch (err) {
    console.error('[CREDITS] getNextDueInstallment → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}
