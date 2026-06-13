// ── Service (lo que consumen las pages) ──────────────────────────────────────
export {
  getFullProfile,
  getProfileSummary,
  getUserInfo,
  getUserName,
  getUserSupportData,
  getUserSubtitle,
  getUserSecurity,
} from './profile.service';

// ── Actions (lo que consumen los server actions) ─────────────────────────────
export {
  verifyIdentity,
  sendIdentityVerificationCode,
  verifyIdentityCode,
  sendEmailVerificationCode,
  verifyEmailCode,
  confirmEmailChange,
  sendPhoneVerificationCode,
  verifyPhoneCode,
  confirmPhoneChange,
  changePassword,
  createPassword,
  unlinkGoogle,
  linkGoogle,
  updateAvatar,
  deleteAccount,
} from './profile.actions';

// ── Types (para tipar props de componentes) ──────────────────────────────────
export type {
  UserProfile,
  UserContact,
  UserSecurity,
  LinkedAccount,
  FullUserProfile,
  UserSummary,
  ActionResult,
} from './profile.types';

// ── Errors (para pattern matching en error states) ───────────────────────────
export type { ProfileError, ProfileErrorCode } from './profile.errors';

// ── Mapper helpers (para UI) ─────────────────────────────────────────────────
export { getDocumentLabel, DOCUMENT_TYPE_LABELS, formatPhoneForDisplay } from './profile.mapper';
