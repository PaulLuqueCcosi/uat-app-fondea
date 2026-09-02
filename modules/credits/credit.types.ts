/**
 * Tipos del dominio Créditos — alineados al backend real.
 *
 * El backend devuelve snake_case con @JsonProperty.
 * El mapper transforma a estos tipos camelCase.
 */

// ─── Estados ──────────────────────────────────────────────────────────────────

/**
 * Estado de un crédito (backend enum — CreditStatus.java).
 * SUSPENDED: congelado por admin (fraude/disputa/orden judicial) — no acumula mora, no recibe pagos.
 * WRITTEN_OFF: castigado contablemente, pero puede recuperarse con pagos voluntarios
 * (vuelve a OVERDUE o PAID_OFF solo con eso, sin intervención manual).
 */
export type CreditStatus =
  | 'PENDING_DISBURSEMENT'
  | 'ACTIVE'
  | 'OVERDUE'
  | 'SUSPENDED'
  | 'WRITTEN_OFF'
  | 'PAID_OFF';

/**
 * Tipo de crédito (backend enum).
 * - STANDARD: viene de una solicitud aprobada (desembolso real, tasa propia)
 * - NEGOTIATION: viene de una cuota en mora de OTRO crédito (deuda reempaquetada,
 *   sin desembolso real, cronograma definido manualmente por el admin)
 */
export type CreditType = 'STANDARD' | 'NEGOTIATION';

/** Estado de una cuota (backend enum) */
export type InstallmentStatus = 'PENDING' | 'CURRENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'NEGOTIATED';

/** Tipo de transacción */
export type TransactionType = 'DISBURSEMENT' | 'REPAYMENT' | 'PENALTY_ACCRUAL' | 'PENALTY_PAYMENT' | 'REVERSAL';

// El método de pago y el resultado de aplicar un pago viven en
// `modules/payment-declarations` — este módulo es de solo lectura del crédito.

// ─── Crédito ──────────────────────────────────────────────────────────────────

/** Crédito del usuario — CreditDetailResponse del backend */
export interface Credit {
  id: string;
  /** Código legible del crédito (ej. "CRD-2026-09-A7F3K9") — mostrar en vez de `id` en la UI. */
  creditCode: string | null;
  status: CreditStatus;
  /** Tipo de crédito — distingue el préstamo natural de los de negociación */
  creditType: CreditType;
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
  /** Configuración de mora aplicada a este crédito */
  penaltyConfig?: PenaltyConfigInfo;
  /**
   * Trazabilidad de origen — solo presentes si creditType = NEGOTIATION.
   * originInstallmentId: la cuota en mora que este crédito vino a cerrar.
   * originCreditId: el crédito inmediato anterior (puede ser otro NEGOTIATION si se anidó).
   * rootCreditId: el crédito STANDARD original, sin importar cuántos saltos haya.
   */
  originInstallmentId?: string | null;
  originCreditId?: string | null;
  rootCreditId?: string | null;
}

/** Configuración de mora — PenaltyConfigInfo del backend */
export interface PenaltyConfigInfo {
  id: string;
  name: string;
  isActive: boolean;
  ranges: PenaltyRangeInfo[];
}

/** Rango de mora — PenaltyRangeInfo del backend */
export interface PenaltyRangeInfo {
  fromDay: number;
  toDay: number | null;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  base: 'INSTALLMENT' | 'PRINCIPAL' | null;
  label: string | null;
  color: string | null;
}

// ─── Cuota ────────────────────────────────────────────────────────────────────

/** Cuota de un crédito — InstallmentItem del backend */
export interface Installment {
  id: string;
  /** Código legible de la cuota (ej. "CRD-2026-09-A7F3K9-03") — mostrar en vez de `id` en la UI. */
  installmentCode: string | null;
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
  /**
   * Solo presente si status = NEGOTIATED.
   * Apunta al crédito de negociación que asumió esta deuda
   * (la cuota no se pagó directamente, se trasladó a ese crédito).
   */
  negotiationCreditId?: string | null;
  /**
   * El cliente ya subió un comprobante que alcanza a esta cuota y está esperando
   * revisión del admin. Mientras sea true, la mora está congelada en el backend.
   *
   * `status` puede seguir siendo OVERDUE (es el estado real, lo que ve el admin y los
   * reportes de cobranza). Usar este flag para mostrar "pago en revisión" en lugar de
   * "vencida": el cliente ya pagó y, salvo que se rechace el comprobante, esa mora no
   * va a existir.
   */
  hasPendingDeclaration: boolean;
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
//
// `PaymentResult` / `PaymentResultDistribution` viven en
// `modules/payment-declarations` — es ese módulo el que aplica pagos (declaración con
// comprobante + aprobación del admin) y el que expone su resultado. Antes estaban
// duplicados acá para el `payInstallment` que se eliminó.

// ─── Labels legibles ──────────────────────────────────────────────────────────

/** Variantes del componente Badge (components/ui/badge.tsx). */
export type CreditBadgeVariant =
  | 'success'
  | 'completed'
  | 'error'
  | 'default'
  | 'warning'
  | 'destructive'
  | 'pending';

export const creditStatusLabels: Record<CreditStatus, string> = {
  PENDING_DISBURSEMENT: 'Por desembolsar',
  ACTIVE: 'Activo',
  OVERDUE: 'Vencido',
  SUSPENDED: 'Suspendido',
  WRITTEN_OFF: 'Castigado',
  PAID_OFF: 'Liquidado',
};

/**
 * Variante de badge por estado. Estaba duplicado en `CreditsTable.tsx` y en la página de
 * detalle del crédito, tipado como `Record<string, ...>` — con `string` como clave, un
 * estado nuevo del backend no rompe la compilación y el badge sale sin color.
 */
export const creditStatusVariants: Record<CreditStatus, CreditBadgeVariant> = {
  PENDING_DISBURSEMENT: 'pending',
  ACTIVE: 'success',
  OVERDUE: 'error',
  SUSPENDED: 'warning',
  WRITTEN_OFF: 'destructive',
  PAID_OFF: 'completed',
};

/**
 * Explicación del estado del crédito para el cliente, con la siguiente acción cuando
 * aplica. El cliente no tiene por qué saber qué significa "Castigado" o "Suspendido".
 */
export const creditStatusDescriptions: Record<CreditStatus, string> = {
  PENDING_DISBURSEMENT:
    'Tu préstamo está aprobado y estamos transfiriendo el dinero. Te avisamos en cuanto llegue.',
  ACTIVE: 'Tu préstamo está al día. Sigue pagando a tiempo para mejorar tu puntaje.',
  // No se nombra "la cuota más antigua": puede ser justo la que ya tiene comprobante en
  // revisión, y entonces el mensaje le pide pagar algo que ya pagó. El aviso de arriba
  // (NextPaymentAlert) ya señala la cuota concreta que corresponde.
  OVERDUE:
    'Tienes cuotas vencidas acumulando mora. Declara tu pago para detenerla.',
  SUSPENDED:
    'Tu préstamo está temporalmente congelado mientras revisamos tu caso. No se genera mora. Escríbenos si necesitas más información.',
  WRITTEN_OFF:
    'Este préstamo pasó a cobranza por falta de pago prolongada. Contáctanos para regularizar tu situación.',
  PAID_OFF: 'Este préstamo está completamente pagado. Ya puedes solicitar uno nuevo.',
};

/**
 * Etiquetas del estado CONTABLE de la cuota, tal como lo maneja el backend.
 *
 * <p>Para mostrarle el estado al CLIENTE usa `getInstallmentViewStatus()` de
 * `installment-view-status.ts`: ese contempla el comprobante en revisión, que acá no se
 * ve. Estas etiquetas quedan para debugging y para cualquier vista que necesite el estado
 * crudo.
 */
export const installmentStatusLabels: Record<InstallmentStatus, string> = {
  PENDING: 'Pendiente',
  CURRENT: 'Por pagar',
  PARTIALLY_PAID: 'Pago parcial',
  PAID: 'Pagada',
  OVERDUE: 'Vencida',
  NEGOTIATED: 'Refinanciada',
};

export const creditTypeLabels: Record<CreditType, string> = {
  STANDARD: 'Préstamo',
  NEGOTIATION: 'Refinanciamiento',
};

export const transactionTypeLabels: Record<TransactionType, string> = {
  DISBURSEMENT: 'Desembolso',
  REPAYMENT: 'Pago de cuota',
  PENALTY_ACCRUAL: 'Mora generada',
  PENALTY_PAYMENT: 'Pago de mora',
  REVERSAL: 'Reversión',
};
