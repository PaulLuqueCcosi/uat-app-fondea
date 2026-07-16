'use server';

import { backendFetch } from '@/lib/backend-fetch';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FundStatus {
  fund_id: string;
  name: string;
  capital_base: number;
  bank_balance: number;
  total_deployed: number;
  available_capital: number;
  utilization_rate: number;
  accumulated_interest: number;
  last_sync_at: string | null;
  last_updated_by: string | null;
}

export interface FundMovement {
  id: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  external_reference: string | null;
  created_by: string;
  created_at: string;
}

export type FundMovementType =
  | 'CAPITAL_INJECTION'
  | 'PROFIT_WITHDRAWAL'
  | 'BANK_SYNC'
  | 'MANUAL_ADJUSTMENT';

// ── Actions ───────────────────────────────────────────────────────────────────

/** Obtiene el estado actual del fondo (capital, disponible, utilización). */
export async function getFundStatusAction(): Promise<FundStatus | null> {
  const res = await backendFetch('/api/v1/admin/fund', {
    method: 'GET',
    context: 'FUND',
  });
  if (res.status === 204 || res.status === 500) return null;
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error obteniendo estado del fondo: ${error}`);
  }
  return res.json();
}

/** Registra un movimiento admin sobre el fondo. Queda en auditoría. */
export async function registerFundMovementAction(
  type: FundMovementType,
  amount: number,
  description: string,
  reference?: string
): Promise<FundMovement> {
  const res = await backendFetch('/api/v1/admin/fund/movements', {
    method: 'POST',
    body: JSON.stringify({ type, amount, description, reference: reference ?? null }),
    context: 'FUND',
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error registrando movimiento: ${error}`);
  }
  return res.json();
}

/** Obtiene los últimos movimientos del fondo. */
export async function getFundMovementsAction(limit: number = 20): Promise<FundMovement[]> {
  const res = await backendFetch(`/api/v1/admin/fund/movements?limit=${limit}`, {
    method: 'GET',
    context: 'FUND',
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error obteniendo movimientos: ${error}`);
  }
  return res.json();
}

// ── Legacy compatibility ──────────────────────────────────────────────────────

/** @deprecated Usa getFundStatusAction(). Mantiene retrocompatibilidad con la page. */
export async function getActivePortfolioConfigAction() {
  const status = await getFundStatusAction();
  if (!status) return null;
  return {
    capitalBase: status.capital_base,
    currency: 'PEN',
  };
}

/** @deprecated Usa registerFundMovementAction(). Mantiene retrocompatibilidad. */
export async function updateCapitalBaseAction(capitalBase: number) {
  // Ajuste manual: setea capitalBase directamente
  return registerFundMovementAction(
    'MANUAL_ADJUSTMENT',
    capitalBase,
    `Ajuste manual de capital base desde admin`
  );
}
