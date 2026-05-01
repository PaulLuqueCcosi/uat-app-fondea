'use server';

import { LoanSimulation } from '@/lib/types';
import { calculateMonthlyPayment } from '@/lib/utils';

const MONTHLY_RATE = 3.5;
const TEA = 51.1;

// ── Simulación de préstamo ────────────────────────────────────────────────────

export async function buildSimulation(amount: number, months: number): Promise<LoanSimulation> {
  return {
    amount,
    months,
    monthlyPayment: calculateMonthlyPayment(amount, MONTHLY_RATE, months),
    monthlyRate: MONTHLY_RATE,
    tea: TEA,
  };
}

export async function updateSimulation(amount: number, months: number): Promise<LoanSimulation> {
  return buildSimulation(amount, months);
}

// ── Resumen del préstamo ──────────────────────────────────────────────────────
// TODO: reemplazar con GET /api/v1/applications/active cuando el backend lo exponga

export async function getLoanSummary(): Promise<{
  amount: number;
  installments: number;
  installmentAmount: number;
  firstPaymentDate: string;
} | null> {
  const sim = await buildSimulation(10000, 12);

  const firstPaymentDate = new Date();
  firstPaymentDate.setDate(firstPaymentDate.getDate() + 30);

  return {
    amount:            sim.amount,
    installments:      sim.months,
    installmentAmount: sim.monthlyPayment,
    firstPaymentDate:  firstPaymentDate.toISOString(),
  };
}

// ── Aplicación activa ─────────────────────────────────────────────────────────
// TODO: reemplazar con getActiveApplicationAction de application.actions.ts

export async function getApplication() {
  return null;
}

// ── Documentos KYC ───────────────────────────────────────────────────────────
// TODO: conectar con POST /api/v1/kyc/documents cuando el backend lo exponga

export async function uploadDocument(
  _file: File,
  _side: 'front' | 'back'
): Promise<{ success: boolean }> {
  return { success: true };
}

// ── Biométrico / selfie ───────────────────────────────────────────────────────
// TODO: conectar con POST /api/v1/kyc/biometric cuando el backend lo exponga

export async function verifyBiometric(
  _selfie: string
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

// ── Info adicional ────────────────────────────────────────────────────────────
// TODO: reemplazar con saveAdditionalProfile de additional-address.actions.ts

export async function saveAdditional(
  _data: unknown
): Promise<{ success: boolean }> {
  return { success: true };
}

// ── Evaluación ────────────────────────────────────────────────────────────────
// TODO: reemplazar con polling a getApplicationStatusAction de application.actions.ts

export async function evaluateApplication(): Promise<{
  result: 'approved' | 'more_info' | 'rejected';
}> {
  return { result: 'approved' };
}

// ── Contrato ──────────────────────────────────────────────────────────────────
// TODO: conectar con POST /api/v1/applications/{id}/sign cuando el backend lo exponga

export async function signContract(
  _signature: string
): Promise<{ success: boolean }> {
  return { success: true };
}

// ── Capacidad de pago ─────────────────────────────────────────────────────────

export async function calculatePaymentCapacity(
  income: number,
  expenses: number,
  debtPayments: number
): Promise<number> {
  const disposable = income - expenses - debtPayments;
  return Math.max(0, Math.round(disposable * 0.6));
}
