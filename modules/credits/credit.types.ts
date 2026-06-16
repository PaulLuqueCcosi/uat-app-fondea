/**
 * Tipos del dominio Créditos — lo que usa el frontend.
 *
 * Estos tipos representan la forma FINAL de los datos después del mapper.
 * El backend puede enviar snake_case, campos extra, etc. — el mapper se encarga.
 *
 * Si el backend cambia un campo, solo se toca el mapper.
 * Si el frontend necesita un campo nuevo, se agrega aquí y en el mapper.
 */

// ─── Estados ──────────────────────────────────────────────────────────────────

/** Estado de un crédito */
export type CreditStatus = 'ACTIVE' | 'COMPLETED' | 'OVERDUE' | 'DEFAULTED';

/** Estado de una cuota */
export type InstallmentStatus = 'PAID' | 'PENDING' | 'UPCOMING' | 'OVERDUE';

/** Método de pago utilizado */
export type PaymentMethod = 'CARD' | 'YAPE' | 'PLIN' | 'TRANSFER' | 'OTHER';

// ─── Crédito ──────────────────────────────────────────────────────────────────

/** Crédito desembolsado — un préstamo activo o completado */
export interface Credit {
  id: string;
  /** Monto total desembolsado */
  amount: number;
  /** Fecha de desembolso (ISO) */
  disbursedDate: string;
  /** Fecha de vencimiento final (ISO) */
  endDate: string;
  /** Número total de cuotas */
  totalInstallments: number;
  /** Cuotas ya pagadas */
  paidInstallments: number;
  /** Monto ya pagado */
  paidAmount: number;
  /** Saldo pendiente */
  pendingBalance: number;
  /** Tasa de interés mensual (%) */
  interestRate: number;
  /** Fecha de próximo vencimiento (ISO) o null si completado */
  nextDueDate: string | null;
  /** Estado del crédito */
  status: CreditStatus;
  /** Cuotas asociadas (resumen) */
  installments: Installment[];
}

// ─── Cuota (resumen) ──────────────────────────────────────────────────────────

/** Cuota de un crédito — vista resumen para listados y calendarios */
export interface Installment {
  id: string;
  /** Número de cuota (1-indexed) */
  number: number;
  /** Monto total de la cuota */
  amount: number;
  /** Fecha de vencimiento (ISO) */
  dueDate: string;
  /** Fecha en que se pagó (ISO) o null si no se ha pagado */
  paidDate: string | null;
  /** Estado de la cuota */
  status: InstallmentStatus;
}

// ─── Cuota (detalle completo) ─────────────────────────────────────────────────

/** Detalle completo de una cuota — incluye desglose y datos de pago */
export interface InstallmentDetail extends Installment {
  /** ID del crédito al que pertenece */
  creditId: string;
  /** Total de cuotas del crédito */
  totalInstallments: number;
  /** Capital (parte del monto que reduce la deuda) */
  principal: number;
  /** Interés */
  interest: number;
  /** Penalidad por mora (0 si no hay atraso) */
  lateFee: number;
  /** Total a pagar (amount + lateFee) */
  totalDue: number;
  /** Días de atraso (0 si no hay) */
  daysLate: number;
  /** Método de pago utilizado (null si no se ha pagado) */
  method: string | null;
  /** ID de transacción del pago (null si no se ha pagado) */
  transactionId: string | null;
  /** URL del comprobante PDF (null si no se ha pagado) */
  receiptUrl: string | null;
}

// ─── Resumen para el dashboard ────────────────────────────────────────────────

/** Resumen agregado de los créditos del usuario */
export interface CreditsSummary {
  activeCount: number;
  completedCount: number;
  overdueCount: number;
  totalPendingBalance: number;
  totalPaidAmount: number;
}

// ─── Historial de pagos ───────────────────────────────────────────────────────

/** Registro de un pago realizado */
export interface PaymentRecord {
  id: string;
  /** ID de la cuota pagada */
  installmentId: string;
  /** ID del crédito */
  creditId: string;
  /** Número de cuota */
  installmentNumber: number;
  /** Total de cuotas */
  totalInstallments: number;
  /** Monto pagado */
  amount: number;
  /** Fecha de vencimiento original */
  dueDate: string;
  /** Fecha efectiva de pago */
  paidDate: string;
  /** Estado de confirmación */
  status: 'CONFIRMED' | 'PENDING' | 'FAILED';
  /** Método de pago */
  method: string | null;
  /** URL del comprobante */
  receiptUrl: string | null;
}

// ─── Labels legibles ──────────────────────────────────────────────────────────

export const creditStatusLabels: Record<CreditStatus, string> = {
  ACTIVE: 'Activo',
  COMPLETED: 'Completado',
  OVERDUE: 'Vencido',
  DEFAULTED: 'En mora',
};

export const installmentStatusLabels: Record<InstallmentStatus, string> = {
  PAID: 'Pagada',
  PENDING: 'Pendiente',
  UPCOMING: 'Próxima',
  OVERDUE: 'Vencida',
};
