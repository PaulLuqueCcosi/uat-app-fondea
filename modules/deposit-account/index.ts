// ── Service (lo consumen pages y actions, nunca los componentes) ─────────────
export {
  getActiveDepositAccount,
  getAdminActiveDepositAccount,
  getDepositAccountHistory,
  createDepositAccount,
  uploadDepositAccountQr,
} from './deposit-account.service';

// ── Types (para tipar props de componentes) ──────────────────────────────────
export type {
  DepositAccountConfig,
  SaveDepositAccountConfigRequest,
} from './deposit-account.types';

// ── Errors (para pattern matching en los error states) ───────────────────────
export type { DepositAccountError, DepositAccountErrorCode } from './deposit-account.errors';

// ── Mapper ───────────────────────────────────────────────────────────────────
export { mapDepositAccountConfigFromBackend } from './deposit-account.mapper';
