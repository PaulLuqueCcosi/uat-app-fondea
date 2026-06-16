// ── Service (lo que consumen las pages y actions) ────────────────────────────
export {
  getCredits,
  getCreditById,
  getActiveCredits,
  getCreditsSummary,
  getInstallmentsByCreditId,
  getInstallmentDetail,
  getPaymentHistory,
  getPaymentsByCreditId,
} from './credit.service';

// ── Types (para tipar props de componentes) ──────────────────────────────────
export type {
  Credit,
  Installment,
  InstallmentDetail,
  CreditsSummary,
  PaymentRecord,
  CreditStatus,
  InstallmentStatus,
  PaymentMethod,
} from './credit.types';

export { creditStatusLabels, installmentStatusLabels } from './credit.types';

// ── Errors (para pattern matching en error states) ───────────────────────────
export type { CreditError, CreditErrorCode } from './credit.errors';

// ── Mapper (para uso en actions si se necesita transformar respuestas) ────────
export {
  mapCreditFromBackend,
  mapInstallmentFromBackend,
  mapInstallmentDetailFromBackend,
  mapCreditsSummaryFromBackend,
  mapPaymentFromBackend,
} from './credit.mapper';
