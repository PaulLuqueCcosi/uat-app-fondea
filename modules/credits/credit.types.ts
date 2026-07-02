/**
 * Tipos del dominio Créditos — alineados al backend real.
 *
 * El backend devuelve snake_case con @JsonProperty.
 * El mapper transforma a estos tipos camelCase.
 */

// ─── Estados ──────────────────────────────────────────────────────────────────

/** Estado de un crédito (backend enum) */
export type CreditStatus = 'ACTIVE' | 'OVERDUE' | 'DEFAULTED' | 'PAID_OFF';

/** Estado de una cuota (backend enum) */
export type InstallmentStatus = 'PENDING' | 'CURRENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

/** Tipo de transacción */
export type TransactionType = 'DISBURSEMENT' | 'REPAYMENT' | 'PENALTY_ACCRUAL' | 'PENALTY_PAYMENT' | 'REVERSAL';

/** Método de pago */
export type PaymentMethod = 'BANK_TRANSFER' | 'YAPE' | 'PLIN' | 'CASH' | 'WALLET' | 'DEBIT_CARD' | 'OTHER';

// ─── Crédito ──────────────────────────────────────────────────────────────────

/** Crédito del usuario — CreditDetailResponse del backend */
export interface Credit {
  id: string;
  status: CreditStatus;
  /** Monto desembolsado original */
  principal: number;
  /** Total a pagar (capital + intereses) */
  totalDue: number;
  /** Total ya pagado */
  totalPaid: number;
  /** Total de penalidades acumuladas */
  totalPenalty: number;
  /** Saldo pendiente */
  totalOutstanding: number;
  /** Número total de cuotas */
  installmentCount: number;
  /** Cuotas completadas */
  installmentsCompleted: number;
  /** Cuotas vencidas */
  installmentsOverdue: number;
  /** Fecha de desembolso (ISO) */
  disbursedAt: string;
  /** Primera fecha de vencimiento */
  firstDueDate: string;
  /** Fecha de vencimiento final */
  maturityDate: string;
  /** Fecha desde la que está en mora (null si al día) */
  overdueSince: string | null;
  /** Fecha en que se liquidó (null si activo) */
  closedAt: string | null;
}

// ─── Cuota ────────────────────────────────────────────────────────────────────

/** Cuota de un crédito — InstallmentItem del backend */
export interface Installment {
  id: string;
  /** Número de cuota (1-indexed) */
  installmentNo: number;
  /** Fecha de vencimiento (ISO date) */
  dueDate: string;
  /** Monto de la cuota (sin mora) */
  amountDue: number;
  /** Monto ya pagado en esta cuota */
  amountPaid: number;
  /** Mora acumulada */
  penaltyAccrued: number;
  /** Mora ya pagada */
  penaltyPaid: number;
  /** Saldo pendiente total de esta cuota (cuota + mora - pagos) */
  outstanding: number;
  /** Estado de la cuota */
  status: InstallmentStatus;
  /** Días de atraso (0 si al día) */
  daysOverdue: number;
  /** Fecha/hora en que se pagó (null si no pagada) */
  paidAt: string | null;
}

// ─── Resumen ──────────────────────────────────────────────────────────────────

/** Resumen de balances — CreditSummaryResponse del backend */
export interface CreditSummary {
  creditId: string;
  totalDue: number;
  totalPaid: number;
  totalPenaltyAccrued: number;
  totalPenaltyPaid: number;
  totalOutstanding: number;
  /** Porcentaje de progreso (0-100) */
  progressPercentage: number;
}

// ─── Próximo pago ─────────────────────────────────────────────────────────────

/** Próxima cuota a pagar — NextPaymentResponse del backend */
export interface NextPayment {
  creditId: string;
  installmentNo: number;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  penaltyAccrued: number;
  /** Monto total que debe pagar el usuario */
  totalToPay: number;
  status: InstallmentStatus;
  daysOverdue: number;
  isOverdue: boolean;
}

// ─── Transacciones ────────────────────────────────────────────────────────────

/** Movimiento/transacción — TransactionItem del backend */
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  transactionDate: string;
  processedAt: string;
  installmentNo: number | null;
  isReversed: boolean;
  createdBy: string;
}

// ─── Resultado de pago ────────────────────────────────────────────────────────

export interface PaymentDistribution {
  installmentNo: number;
  appliedToPenalty: number;
  appliedToInstallment: number;
  installmentStatus: string;
}

export interface PaymentResult {
  creditId: string;
  totalApplied: number;
  remaining: number;
  creditStatus: string;
  distributions: PaymentDistribution[];
}

// ─── Request de pago (camelCase — tal cual el backend lo espera) ──────────────

export interface RegisterPaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  bankName?: string;
  accountOrigin?: string;
  transactionDate?: string;
  source?: string;
  externalId?: string;
  receiptUrl?: string;
  rawPayload?: string;
}

// ─── Labels legibles ──────────────────────────────────────────────────────────

export const creditStatusLabels: Record<CreditStatus, string> = {
  ACTIVE: 'Activo',
  OVERDUE: 'Vencido',
  DEFAULTED: 'En mora',
  PAID_OFF: 'Liquidado',
};

export const installmentStatusLabels: Record<InstallmentStatus, string> = {
  PENDING: 'Pendiente',
  CURRENT: 'Próxima',
  PARTIALLY_PAID: 'Pago parcial',
  PAID: 'Pagada',
  OVERDUE: 'Vencida',
};

export const transactionTypeLabels: Record<TransactionType, string> = {
  DISBURSEMENT: 'Desembolso',
  REPAYMENT: 'Pago de cuota',
  PENALTY_ACCRUAL: 'Mora generada',
  PENALTY_PAYMENT: 'Pago de mora',
  REVERSAL: 'Reversión',
};
