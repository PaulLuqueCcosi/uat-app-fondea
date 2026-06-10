import { mockCredits, mockInstallmentDetails, mockPayments } from './mock-data';
import type { Credit, InstallmentDetail, PaymentRecord } from './types';

/**
 * Abstracción de acceso a datos de créditos.
 *
 * HOY: retorna data mock local.
 * MAÑANA: reemplazar por fetch al backend real.
 *
 * El consumidor no sabe de dónde viene la data.
 */

// ─── Helpers internos ─────────────────────────────────────────────────────────

const SIMULATED_DELAY_MS = 10;

async function simulateNetwork<T>(data: T): Promise<T> {
  if (process.env.NODE_ENV === 'development') {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));
  }
  return data;
}

// ─── Créditos ─────────────────────────────────────────────────────────────────

/** Obtiene todos los créditos del usuario autenticado */
export async function getUserCredits(): Promise<Credit[]> {
  return simulateNetwork(mockCredits);
}

/** Obtiene un crédito por su ID */
export async function getCreditById(id: string): Promise<Credit | null> {
  const found = mockCredits.find((c) => c.id === id) ?? null;
  return simulateNetwork(found);
}

/** Obtiene solo los créditos activos */
export async function getActiveCredits(): Promise<Credit[]> {
  const active = mockCredits.filter((c) => c.status === 'ACTIVE');
  return simulateNetwork(active);
}

/** Obtiene solo los créditos completados */
export async function getCompletedCredits(): Promise<Credit[]> {
  const completed = mockCredits.filter((c) => c.status === 'COMPLETED');
  return simulateNetwork(completed);
}

// ─── Resumen ──────────────────────────────────────────────────────────────────

export interface CreditsSummary {
  activeCount: number;
  completedCount: number;
  overdueCount: number;
  totalPendingBalance: number;
  totalPaidAmount: number;
}

/** Obtiene el resumen general de créditos (para el dashboard) */
export async function getCreditsSummary(): Promise<CreditsSummary> {
  const credits = mockCredits;
  const summary: CreditsSummary = {
    activeCount: credits.filter((c) => c.status === 'ACTIVE').length,
    completedCount: credits.filter((c) => c.status === 'COMPLETED').length,
    overdueCount: credits.filter((c) => c.status === 'OVERDUE').length,
    totalPendingBalance: credits.reduce((sum, c) => sum + c.pendingBalance, 0),
    totalPaidAmount: credits.reduce((sum, c) => sum + c.paidAmount, 0),
  };
  return simulateNetwork(summary);
}

// ─── Cuotas ───────────────────────────────────────────────────────────────────

/** Obtiene el detalle de cuotas de un crédito */
export async function getInstallmentsByCreditId(creditId: string): Promise<InstallmentDetail[]> {
  const details = mockInstallmentDetails.filter((d) => d.creditId === creditId);
  return simulateNetwork(details);
}

/** Obtiene el detalle de una cuota específica */
export async function getInstallmentDetail(installmentId: string): Promise<InstallmentDetail | null> {
  const found = mockInstallmentDetails.find((d) => d.id === installmentId) ?? null;
  return simulateNetwork(found);
}

// ─── Pagos ────────────────────────────────────────────────────────────────────

/** Obtiene el historial de pagos del usuario */
export async function getPaymentHistory(): Promise<PaymentRecord[]> {
  return simulateNetwork(mockPayments);
}

/** Obtiene pagos de un crédito específico */
export async function getPaymentsByCreditId(creditId: string): Promise<PaymentRecord[]> {
  const payments = mockPayments.filter((p) => p.creditId === creditId);
  return simulateNetwork(payments);
}
