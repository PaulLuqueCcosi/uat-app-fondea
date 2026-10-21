/**
 * Presentación del desglose de comisiones con descuentos, compartida por la calculadora,
 * el simulador del admin y el detalle de las solicitudes.
 *
 * Desde que fondea-calculator-service reparte los descuentos entre las comisiones, el monto
 * final de cada comisión ya los incluye y la suma de las comisiones es el total de comisiones
 * (`totalFeesResult`). Las solicitudes guardadas antes de ese cambio traen los descuentos fijos
 * solo en los totales: ahí se conserva la presentación anterior (subtotal con descuentos
 * porcentuales y luego los descuentos fijos aparte).
 *
 * Todos los cálculos de acá se hacen en centavos enteros: sumar y restar montos decimales en
 * coma flotante (0.1 + 0.2) puede dar centavos de diferencia y el subtotal no cuadraría con las
 * filas que lo componen.
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

/** Paso de descuento de una comisión, tal como lo trae la calculadora. */
export interface FeeHistoryStep {
  code: string;
  label: string;
  type?: string;
  value: number;
  discountAmount: number;
  order?: number;
}

export interface FeeWithHistory {
  originalAmount: number;
  finalAmount: number;
  discountHistory: ReadonlyArray<FeeHistoryStep>;
}

const toCents = (amount: number): number => Math.round(amount * 100);
const fromCents = (cents: number): number => cents / 100;
const isFixed = (type: string | undefined): boolean => type === 'FIXED_AMOUNT';

/** Las comisiones traen repartidos todos los descuentos: suman exactamente el total de comisiones. */
export function feesAreDistributed(fees: ReadonlyArray<{ finalAmount: number }>, totalFeesResult: number): boolean {
  const sum = fees.reduce((acc, f) => acc + toCents(f.finalAmount), 0);
  return sum === toCents(totalFeesResult);
}

/** Texto del tooltip de un monto tachado: el descuento que lo reemplazó. */
export function discountStepText(step: DiscountStep | undefined): string {
  if (!step) return '';
  if (isFixed(step.type)) return `${step.label} -S/ ${step.amount.toFixed(2)}`;
  return `${step.label} -${step.value}%`;
}

export interface SubtotalChain {
  /** Montos tachados, del original al último intermedio, con el descuento que los reemplazó. */
  struck: Array<{ amount: number; tooltip: string }>;
  /** Subtotal final de comisiones. */
  final: number;
  /** Las comisiones traen los descuentos repartidos (solicitudes nuevas). */
  distributed: boolean;
}

/**
 * Cadena del subtotal de comisiones: original → tras cada descuento → final.
 *
 * Con las comisiones repartidas la cadena sale de las propias comisiones (suma de lo que le
 * queda a cada una tras cada descuento), así cada monto tachado es exactamente la suma de las
 * filas de comisiones en ese paso y el último paso termina en el total de comisiones. Con datos
 * anteriores solo recorre los descuentos porcentuales a partir de los totales declarados.
 */
export function subtotalChain(
  fees: ReadonlyArray<FeeWithHistory>,
  totalFeesOriginal: number,
  discounts: ReadonlyArray<SubtotalDiscount>,
  totals: { totalFeesWithPercentageDiscounts: number; totalFeesResult: number },
): SubtotalChain {
  if (feesAreDistributed(fees, totals.totalFeesResult)) {
    return { ...chainFromFees(fees), distributed: true };
  }
  return { ...legacyChain(totalFeesOriginal, discounts, totals.totalFeesWithPercentageDiscounts), distributed: false };
}

function chainFromFees(fees: ReadonlyArray<FeeWithHistory>): Omit<SubtotalChain, 'distributed'> {
  // Pasos distintos en el orden en que se aplicaron: porcentuales antes que fijos, y dentro de cada
  // tipo por el orden configurado (o por aparición si el dato no lo trae).
  const steps = new Map<string, { step: FeeHistoryStep; seen: number }>();
  let seen = 0;
  for (const fee of fees) {
    for (const h of fee.discountHistory) {
      if (!steps.has(h.code)) steps.set(h.code, { step: h, seen: seen++ });
    }
  }
  const ordered = [...steps.values()].sort(
    (a, b) =>
      Number(isFixed(a.step.type)) - Number(isFixed(b.step.type)) ||
      (a.step.order ?? a.seen) - (b.step.order ?? b.seen) ||
      a.seen - b.seen,
  );

  const running = fees.map((f) => toCents(f.originalAmount));
  const original = running.reduce((a, b) => a + b, 0);
  const struck: SubtotalChain['struck'] = [];
  for (const { step } of ordered) {
    struck.push({ amount: fromCents(running.reduce((a, b) => a + b, 0)), tooltip: '' });
    let stepTotal = 0;
    fees.forEach((fee, i) => {
      const entry = fee.discountHistory.find((h) => h.code === step.code);
      if (!entry) return;
      const cents = toCents(entry.discountAmount);
      running[i] -= cents;
      stepTotal += cents;
    });
    struck[struck.length - 1].tooltip = discountStepText({
      label: step.label,
      type: step.type,
      value: step.value,
      amount: fromCents(stepTotal),
    });
  }
  const final = fees.reduce((acc, f) => acc + toCents(f.finalAmount), 0);
  return { struck: original === final ? [] : struck, final: fromCents(final) };
}

function legacyChain(
  totalFeesOriginal: number,
  discounts: ReadonlyArray<SubtotalDiscount>,
  totalFeesWithPercentageDiscounts: number,
): Omit<SubtotalChain, 'distributed'> {
  const percentage = discounts.filter((d) => !isFixed(d.type));
  const final = toCents(totalFeesWithPercentageDiscounts);
  const struck: SubtotalChain['struck'] = [];
  let acc = toCents(totalFeesOriginal);
  for (const d of percentage) {
    struck.push({
      amount: fromCents(acc),
      tooltip: discountStepText({ label: d.label, type: d.type, value: d.value, amount: d.totalDiscountAmount }),
    });
    acc = Math.max(0, acc - toCents(d.totalDiscountAmount));
  }
  return { struck: toCents(totalFeesOriginal) === final ? [] : struck, final: fromCents(final) };
}
