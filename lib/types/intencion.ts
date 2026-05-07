// ─── Intencion / Loan Config ─────────────────────────────────────────────────

export interface LoanSimulation {
  amount: number;
  months: number;
  monthlyPayment: number;
  monthlyRate: number;
  tea: number;
}

export interface IntencionConfig {
  intencionId: string;
  productId: string;
  amount: number;
  termDays: number;
  installmentCount: number;
  isFirstLoan: boolean;
  status: string;
  calculatorIntentionId: string;
  createdAt: string;
  updatedAt: string;
}
