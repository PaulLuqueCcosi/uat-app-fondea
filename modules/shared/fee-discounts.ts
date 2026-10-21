/**
 * Presentación del desglose de comisiones con descuentos, compartida por la calculadora,
 * el simulador del admin y el detalle de las solicitudes.
 *
 * Desde que fondea-calculator-service reparte los descuentos fijos entre las comisiones,
 * el monto final de cada comisión ya los incluye y la suma de las comisiones es el total
 * de comisiones (`totalFeesResult`). Las solicitudes guardadas antes de ese cambio traen
 * los descuentos fijos solo en los totales: ahí se conserva la presentación anterior
 * (subtotal con descuentos porcentuales y luego los descuentos fijos aparte).
 */

export interface DiscountStep {
  label: string;
  /** 'PERCENTAGE' o 'FIXED_AMOUNT'. Sin tipo se asume porcentaje, como antes. */
  type?: string;
  /** Porcentaje (si es porcentual) o monto fijo configurado. */
  value: number;
  /** Monto que este paso descontó (en una comisión: su parte del descuento). */
  amount: number;
}

export interface SubtotalDiscount {
  label: string;
  type?: string;
  value: number;
  totalDiscountAmount: number;
}

const CENT = 0.005;

/** Las comisiones traen repartidos todos los descuentos: suman exactamente el total de comisiones. */
export function feesAreDistributed(fees: ReadonlyArray<{ finalAmount: number }>, totalFeesResult: number): boolean {
  const sum = fees.reduce((acc, f) => acc + f.finalAmount, 0);
  return Math.abs(sum - totalFeesResult) < CENT * 2;
}

/** Texto del tooltip de un monto tachado: el descuento que lo reemplazó. */
export function discountStepText(step: DiscountStep | undefined): string {
  if (!step) return '';
  if (step.type === 'FIXED_AMOUNT') return `${step.label} -S/ ${step.amount.toFixed(2)}`;
  return `${step.label} -${step.value}%`;
}

export interface SubtotalChain {
  /** Montos tachados, del original al último intermedio, con el descuento que los reemplazó. */
  struck: Array<{ amount: number; tooltip: string }>;
  /** Subtotal final de comisiones. */
  final: number;
}

/**
 * Cadena del subtotal de comisiones: original → tras cada descuento → final.
 * Con las comisiones repartidas la cadena incluye los descuentos fijos y termina en el total
 * de comisiones; con datos anteriores solo recorre los porcentuales y termina en el subtotal
 * con descuentos porcentuales.
 */
export function subtotalChain(
  totalFeesOriginal: number,
  discounts: ReadonlyArray<SubtotalDiscount>,
  totals: { totalFeesWithPercentageDiscounts: number; totalFeesResult: number },
  distributed: boolean,
): SubtotalChain {
  const isFixed = (d: SubtotalDiscount) => d.type === 'FIXED_AMOUNT';
  const steps = [
    ...discounts.filter((d) => !isFixed(d)),
    ...(distributed ? discounts.filter(isFixed) : []),
  ];
  const final = distributed ? totals.totalFeesResult : totals.totalFeesWithPercentageDiscounts;

  const struck: SubtotalChain['struck'] = [];
  let acc = totalFeesOriginal;
  for (const d of steps) {
    struck.push({
      amount: acc,
      tooltip: discountStepText({ label: d.label, type: d.type, value: d.value, amount: d.totalDiscountAmount }),
    });
    acc = Math.max(0, acc - d.totalDiscountAmount);
  }
  // Sin descuentos que cambien el monto no hay nada que tachar.
  return { struck: Math.abs(totalFeesOriginal - final) < CENT ? [] : struck, final };
}
