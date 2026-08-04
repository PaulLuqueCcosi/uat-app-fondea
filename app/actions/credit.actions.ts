'use server';

/**
 * Server Actions de Créditos — thin wrappers con autenticación.
 *
 * Responsabilidad: validar sesión y delegar al service.
 * NO tiene lógica propia.
 */

import { requireValidSession } from './auth.actions';
import * as creditService from '@/modules/credits/credit.service';
import type { RegisterPaymentRequest } from '@/modules/credits';

// ── Créditos ──────────────────────────────────────────────────────────────────

/** Lista todos los créditos del usuario */
export async function getCreditsAction() {
  await requireValidSession();
  return creditService.getCredits();
}

/**
 * Créditos activos del usuario — puede haber más de uno
 * (el natural + negociaciones abiertas para cuotas en mora).
 */
export async function getActiveCreditsAction() {
  await requireValidSession();
  return creditService.getActiveCredits();
}

/** Crédito por ID */
export async function getCreditByIdAction(id: string) {
  await requireValidSession();
  return creditService.getCreditById(id);
}

// ── Resumen ───────────────────────────────────────────────────────────────────

/** Resumen de balances de un crédito */
export async function getCreditSummaryAction(creditId: string) {
  await requireValidSession();
  return creditService.getCreditSummary(creditId);
}

// ── Cuotas ────────────────────────────────────────────────────────────────────

/** Cronograma completo de cuotas */
export async function getInstallmentsAction(creditId: string) {
  await requireValidSession();
  return creditService.getInstallments(creditId);
}

/** Detalle de una cuota por número */
export async function getInstallmentByNoAction(creditId: string, installmentNo: number) {
  await requireValidSession();
  return creditService.getInstallmentByNo(creditId, installmentNo);
}

// ── Próximo pago ──────────────────────────────────────────────────────────────

/** Próxima cuota a pagar */
export async function getNextPaymentAction(creditId: string) {
  await requireValidSession();
  return creditService.getNextPayment(creditId);
}

// ── Transacciones ─────────────────────────────────────────────────────────────

/** Historial de transacciones */
export async function getTransactionsAction(creditId: string) {
  await requireValidSession();
  return creditService.getTransactions(creditId);
}

// ── Pagar cuota ───────────────────────────────────────────────────────────────

/** Registrar pago de una cuota */
export async function payInstallmentAction(
  creditId: string,
  installmentNo: number,
  payment: RegisterPaymentRequest,
) {
  await requireValidSession();
  return creditService.payInstallment(creditId, installmentNo, payment);
}
