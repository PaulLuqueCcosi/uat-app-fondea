/**
 * Préstamo "real" para el simulador de mora: lo arma la calculadora con las tarifas vigentes y de ahí
 * salen, por cuota, los montos que la mora usa como base (interés, gastos y tarifa) más el capital.
 *
 * Mapeo puro (sin red) para poder probarlo y reusarlo.
 */

export type MoraCategory = 'INTERES_COMPENSATORIO' | 'GASTOS' | 'TARIFA';

export interface RealLoanInput {
  amount: number;
  termDays: number;
  installmentCount: number;
  creditScore: number;
  isFirstLoan: boolean;
}

export interface RealFeeLine {
  code: string;
  category: string;
  amount: number;
}

export interface RealInstallment {
  no: number;
  dueDate: string;
  /** Capital de la cuota: es el "capital vencido" si la cuota entra en mora. */
  principal: number;
  /** Suma de las comisiones de cada categoría (sin IGV: la mora no lleva IGV). */
  amounts: Record<MoraCategory, number>;
  /** Días del período que cubre la cuota. */
  periodDays: number;
  lines: RealFeeLine[];
}

export interface RealLoan {
  input: RealLoanInput;
  installments: RealInstallment[];
}

const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

/** Convierte la respuesta de `POST /api/simulate` de la calculadora. */
export function mapCalculatorSimulation(raw: unknown, input: RealLoanInput): RealLoan {
  const schedule = (raw as { schedule?: unknown[] } | null)?.schedule;
  if (!Array.isArray(schedule) || schedule.length === 0) {
    throw new Error('La calculadora no devolvió cuotas para ese préstamo');
  }
  const periodDays = Math.max(1, Math.round(input.termDays / input.installmentCount));
  const installments = schedule.map((item, index): RealInstallment => {
    const s = item as {
      installmentNo?: number;
      dueDate?: string;
      principalAmount?: number;
      feeLines?: Array<{ feeCode?: string; category?: string; amount?: number }>;
    };
    const lines: RealFeeLine[] = (s.feeLines ?? []).map((l) => ({
      code: String(l.feeCode ?? ''),
      category: String(l.category ?? ''),
      amount: Number(l.amount ?? 0),
    }));
    const sum = (category: MoraCategory) => round2(lines.filter((l) => l.category === category).reduce((t, l) => t + l.amount, 0));
    return {
      no: s.installmentNo ?? index + 1,
      dueDate: s.dueDate ?? '',
      principal: round2(Number(s.principalAmount ?? 0)),
      amounts: { INTERES_COMPENSATORIO: sum('INTERES_COMPENSATORIO'), GASTOS: sum('GASTOS'), TARIFA: sum('TARIFA') },
      periodDays,
      lines,
    };
  });
  return { input, installments };
}

/** Texto corto que explica de dónde salen los montos (va en la exportación). */
export function describeRealInstallment(loan: RealLoan, installment: RealInstallment): string {
  const { amount, termDays, installmentCount, creditScore } = loan.input;
  return `préstamo calculado hoy con las tarifas vigentes: S/ ${amount} a ${termDays} días en ${installmentCount} cuotas, puntaje ${creditScore}, cuota ${installment.no} de ${installmentCount}`;
}
