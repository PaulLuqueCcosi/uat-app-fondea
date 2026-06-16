'use server';

/**
 * Server Actions de Créditos — thin wrappers con autenticación.
 *
 * Responsabilidad: validar sesión y delegar al service.
 * NO tiene lógica propia.
 */

import { requireValidSession } from './auth.actions';
import * as creditService from '@/modules/credits/credit.service';

// ── Créditos ──────────────────────────────────────────────────────────────────

export async function getCreditsAction() {
  await requireValidSession();
  return creditService.getCredits();
}

export async function getCreditByIdAction(id: string) {
  await requireValidSession();
  return creditService.getCreditById(id);
}

export async function getActiveCreditsAction() {
  await requireValidSession();
  return creditService.getActiveCredits();
}

export async function getCreditsSummaryAction() {
  await requireValidSession();
  return creditService.getCreditsSummary();
}

// ── Cuotas ────────────────────────────────────────────────────────────────────

export async function getInstallmentsByCreditIdAction(creditId: string) {
  await requireValidSession();
  return creditService.getInstallmentsByCreditId(creditId);
}

export async function getInstallmentDetailAction(installmentId: string) {
  await requireValidSession();
  return creditService.getInstallmentDetail(installmentId);
}

export async function getNextDueInstallmentAction(creditId: string) {
  await requireValidSession();
  return creditService.getNextDueInstallment(creditId);
}

// ── Pagos ─────────────────────────────────────────────────────────────────────

export async function getPaymentHistoryAction() {
  await requireValidSession();
  return creditService.getPaymentHistory();
}

export async function getPaymentsByCreditIdAction(creditId: string) {
  await requireValidSession();
  return creditService.getPaymentsByCreditId(creditId);
}
