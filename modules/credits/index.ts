// ── Service (lo que consumen las pages y actions) ────────────────────────────
// Solo lectura: el pago entra por `modules/payment-declarations` (comprobante +
// validación de un admin), no desde acá.
export {
  getCredits,
  getActiveCredits,
  getCreditById,
  getCreditSummary,
  getInstallments,
  getInstallmentByNo,
  getNextPayment,
  getTransactions,
} from './credit.service';

// ── Types (para tipar props de componentes) ──────────────────────────────────
export type {
  Credit,
  Installment,
  CreditSummary,
  NextPayment,
  Transaction,
  PenaltyConfigInfo,
  PenaltyRangeInfo,
  CreditStatus,
  CreditType,
  InstallmentStatus,
  TransactionType,
  CreditBadgeVariant,
} from './credit.types';

export {
  creditStatusLabels,
  creditStatusVariants,
  creditStatusDescriptions,
  creditTypeLabels,
  installmentStatusLabels,
  transactionTypeLabels,
} from './credit.types';

// ── Estado visible de una cuota para el CLIENTE ──────────────────────────────
// Traduce `status + hasPendingDeclaration` a lo que corresponde mostrar. Usar esto en
// las vistas del cliente en vez de leer `status` directo — ver el javadoc del módulo.
export {
  getInstallmentViewStatus,
  installmentViewStatusLabels,
} from './installment-view-status';
export type {
  InstallmentViewStatus,
  InstallmentViewStatusInfo,
  BadgeVariant,
} from './installment-view-status';

// ── Errors (para pattern matching en error states) ───────────────────────────
export type { CreditError, CreditErrorCode } from './credit.errors';

// ── Mapper (para uso directo si se necesita) ─────────────────────────────────
export {
  mapCreditFromBackend,
  mapInstallmentFromBackend,
  mapCreditSummaryFromBackend,
  mapNextPaymentFromBackend,
  mapTransactionFromBackend,
} from './credit.mapper';
