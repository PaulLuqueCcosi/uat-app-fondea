import type { InstallmentChargeItem } from '@/modules/admin/admin-credit-detail.service';
import type { ChargeConcept } from './charge-concepts';

/** Un balde de la cuota con su número en el orden en que un pago lo cubre (1 = lo primero que se paga). */
export interface ChargeRow {
  item: InstallmentChargeItem;
  order: number;
}

export interface ChargeTotals {
  total: number;
  paid: number;
  outstanding: number;
}

/** Una categoría del interés de la cuota (interés compensatorio, gastos o tarifa) con sus fee. */
export interface InterestCategory extends ChargeTotals {
  concept: ChargeConcept;
  rows: ChargeRow[];
}

/**
 * La cuota agrupada para mostrarla: capital, interés de la cuota (por tipo, o como un bloque si no tiene desglose)
 * y mora por el atraso. El orden de pago no cambia: cada fila conserva su número en `order`.
 */
export interface GroupedCharges {
  principal: ChargeRow | null;
  /** Interés de la cuota sin desglose por fee (créditos anteriores y de negociación). */
  interestBlock: ChargeRow | null;
  /** Interés de la cuota por tipo, en el orden: interés compensatorio, gastos y tarifa. */
  interestCategories: InterestCategory[];
  interestTotals: ChargeTotals;
  penalties: ChargeRow[];
  penaltyTotals: ChargeTotals;
  grandTotals: ChargeTotals;
}

/** Orden en que se muestran los tipos del interés de la cuota. */
const INTEREST_DISPLAY_ORDER: readonly ChargeConcept[] = ['INTERES_COMPENSATORIO', 'GASTOS', 'TARIFA'];

const ZERO: ChargeTotals = { total: 0, paid: 0, outstanding: 0 };

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

function sum(rows: ChargeRow[]): ChargeTotals {
  return rows.reduce<ChargeTotals>(
    (acc, { item }) => ({
      total: round2(acc.total + item.total),
      paid: round2(acc.paid + item.paid),
      outstanding: round2(acc.outstanding + item.outstanding),
    }),
    ZERO,
  );
}

/** Agrupa los baldes que informa el backend (en orden de cascada) para mostrarlos por tipo. */
export function groupCharges(items: InstallmentChargeItem[]): GroupedCharges {
  const rows: ChargeRow[] = items.map((item, index) => ({ item, order: index + 1 }));

  const principal = rows.find((r) => r.item.type === 'PRINCIPAL') ?? null;
  const interestBlock = rows.find((r) => r.item.type === 'INTEREST') ?? null;
  const feeRows = rows.filter((r) => r.item.type === 'FEE');
  const penalties = rows.filter((r) => r.item.type === 'PENALTY');

  const interestCategories: InterestCategory[] = INTEREST_DISPLAY_ORDER.flatMap((concept) => {
    const inCategory = feeRows.filter((r) => r.item.concept === concept);
    return inCategory.length > 0 ? [{ concept, rows: inCategory, ...sum(inCategory) }] : [];
  });

  const interestTotals = sum(interestBlock ? [interestBlock] : feeRows);
  const penaltyTotals = sum(penalties);
  const grandTotals = sum(rows);
  return { principal, interestBlock, interestCategories, interestTotals, penalties, penaltyTotals, grandTotals };
}

export type ChargeState = 'covered' | 'partial' | 'pending';

export function chargeState({ total, paid, outstanding }: ChargeTotals): ChargeState {
  if (outstanding <= 0 && total > 0) return 'covered';
  return paid > 0 ? 'partial' : 'pending';
}
