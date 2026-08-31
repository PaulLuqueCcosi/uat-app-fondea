// ── Service (lo que consumen las pages y actions) ────────────────────────────
export {
  submitPaymentDeclaration,
  listMyPaymentDeclarations,
  getMyPaymentDeclarationById,
  listAdminPaymentDeclarations,
  getAdminPaymentDeclarationById,
  approvePaymentDeclaration,
  rejectPaymentDeclaration,
  getPaymentQuote,
} from './payment-declaration.service';
export type { PaginatedPaymentDeclarations } from './payment-declaration.service';

// ── Types (para tipar props de componentes) ──────────────────────────────────
export type {
  PaymentDeclaration,
  PaymentDeclarationStatus,
  VoucherSummary,
  VoucherDetail,
  PaymentResult,
  PaymentResultDistribution,
  PaymentDeclarationDetail,
  AdminPaymentDeclarationListParams,
  ApprovePaymentDeclarationRequest,
  RejectPaymentDeclarationRequest,
  PaymentQuote,
  InstallmentQuote,
} from './payment-declaration.types';

export { paymentDeclarationStatusLabels } from './payment-declaration.types';

// ── Errors (para pattern matching en error states) ───────────────────────────
export type { PaymentDeclarationError, PaymentDeclarationErrorCode } from './payment-declaration.errors';

// ── Mapper (para uso directo si se necesita) ─────────────────────────────────
export {
  mapPaymentDeclarationFromBackend,
  mapPaymentDeclarationDetailFromBackend,
} from './payment-declaration.mapper';
