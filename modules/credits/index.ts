// ── Service (lo que consumen las pages y actions) ────────────────────────────
export {
  getCredits,
  getActiveCredits,
  getCreditById,
  getCreditSummary,
  getInstallments,
  getInstallmentByNo,
  getNextPayment,
  getTransactions,
  payInstallment,
} from './credit.service';

// ── Types (para tipar props de componentes) ──────────────────────────────────
export type {
  Credit,
  Installment,
  CreditSummary,
  NextPayment,
  Transaction,
  PaymentResult,
  PaymentDistribution,
  RegisterPaymentRequest,
  CreditStatus,
  CreditType,
  InstallmentStatus,
  TransactionType,
  PaymentMethod,
} from './credit.types';

export {
  creditStatusLabels,
  creditTypeLabels,
  installmentStatusLabels,
  transactionTypeLabels,
} from './credit.types';

// ── Errors (para pattern matching en error states) ───────────────────────────
export type { CreditError, CreditErrorCode } from './credit.errors';

// ── Mapper (para uso directo si se necesita) ─────────────────────────────────
export {
  mapCreditFromBackend,
  mapInstallmentFromBackend,
  mapCreditSummaryFromBackend,
  mapNextPaymentFromBackend,
  mapTransactionFromBackend,
  mapPaymentResultFromBackend,
} from './credit.mapper';
