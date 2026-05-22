// ─── Intencion / Loan Config ─────────────────────────────────────────────────

export interface LoanSimulation {
  amount: number;
  months: number;
  monthlyPayment: number;
  monthlyRate: number;
  tea: number;
}

/**
 * Estados posibles de una intención de préstamo.
 * Espejo del enum del backend: UserLoanIntentionStatus
 */
export type IntencionStatus = 'ACTIVE' | 'REPLACED' | 'LOCKED' | 'CANCELLED';

export interface IntencionConfig {
  intencionId: string;
  productId: string;
  amount: number;
  termDays: number;
  installmentCount: number;
  isFirstLoan: boolean;
  status: IntencionStatus;
  calculatorIntentionId: string;
  createdAt: string;
  updatedAt: string;
}
