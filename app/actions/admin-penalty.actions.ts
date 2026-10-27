'use server';

import { requireAdminRole } from './auth.actions';
import { calculatorFetch } from '@/lib/calculator-fetch';
import { mapCalculatorSimulation, type RealLoan, type RealLoanInput } from '@/modules/admin/mora-real-loan';
import {
  getActivePenaltyConfig,
  getPenaltyConfigHistory,
  createPenaltyConfig,
  getConceptsCatalog,
  getComplianceState,
  updateComplianceProfile,
  simulatePenalty,
  type ComplianceProfile,
  type ComplianceState,
  type ConceptsCatalog,
  type PenaltyConfigResponse,
  type PenaltyResult,
  type SavePenaltyConfigRequest,
  type SimulatePenaltyRequest,
  type SimulatePenaltyResponse,
} from '@/modules/admin/admin-penalty.service';

export async function getActivePenaltyConfigAction(): Promise<PenaltyConfigResponse | null> {
  await requireAdminRole();
  return getActivePenaltyConfig();
}

export async function getPenaltyConfigHistoryAction(): Promise<PenaltyConfigResponse[]> {
  await requireAdminRole();
  return getPenaltyConfigHistory();
}

export async function createPenaltyConfigAction(
  request: SavePenaltyConfigRequest,
): Promise<PenaltyResult<PenaltyConfigResponse | null>> {
  await requireAdminRole();
  return createPenaltyConfig(request);
}

export async function getConceptsCatalogAction(): Promise<ConceptsCatalog | null> {
  await requireAdminRole();
  return getConceptsCatalog();
}

export async function getComplianceStateAction(): Promise<ComplianceState | null> {
  await requireAdminRole();
  return getComplianceState();
}

export async function updateComplianceProfileAction(
  profile: ComplianceProfile,
  reason: string,
): Promise<PenaltyResult<ComplianceState | null>> {
  await requireAdminRole();
  return updateComplianceProfile(profile, reason);
}

export async function simulatePenaltyAction(
  request: SimulatePenaltyRequest,
): Promise<PenaltyResult<SimulatePenaltyResponse>> {
  await requireAdminRole();
  return simulatePenalty(request);
}

const PRODUCT_ID = process.env.NEXT_PUBLIC_PRODUCT_ID ?? '550e8400-e29b-41d4-a716-446655440000';

/**
 * Arma un préstamo con la calculadora y las tarifas vigentes para usar sus cuotas como datos reales en el
 * simulador de mora (interés, gastos y tarifa por cuota, más el capital).
 */
export async function loadRealLoanAction(
  input: RealLoanInput,
): Promise<{ ok: true; data: RealLoan } | { ok: false; message: string }> {
  await requireAdminRole();

  const valid =
    Number.isFinite(input.amount) && input.amount >= 1 && input.amount <= 100000 &&
    Number.isInteger(input.termDays) && input.termDays >= 1 && input.termDays <= 365 &&
    Number.isInteger(input.installmentCount) && input.installmentCount >= 1 && input.installmentCount <= 60 &&
    Number.isInteger(input.creditScore) && input.creditScore >= 10 && input.creditScore <= 999;
  if (!valid) {
    return { ok: false, message: 'Revisa los datos: monto de 1 a 100000, plazo de 1 a 365 días, de 1 a 60 cuotas y puntaje de 10 a 999' };
  }

  try {
    const res = await calculatorFetch('/api/simulate', {
      method: 'POST',
      context: 'MORA_REAL_LOAN',
      body: JSON.stringify({
        productId: PRODUCT_ID,
        amount: input.amount,
        termDays: input.termDays,
        installmentCount: input.installmentCount,
        isFirstLoan: input.isFirstLoan,
        creditScore: input.creditScore,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { ok: false, message: body?.message ?? `La calculadora respondió ${res.status}` };
    }
    return { ok: true, data: mapCalculatorSimulation(await res.json(), input) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'No se pudo consultar la calculadora' };
  }
}
