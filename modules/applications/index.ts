// ── Service ───────────────────────────────────────────────────────────────────
export { getApplications } from './application.service';

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  ApplicationRecord,
  ApplicationStatus,
  ApplicationFailureCode,
  StatusVariant,
} from './application.types';

export {
  applicationStatusLabels,
  applicationStatusVariants,
} from './application.types';

// ── Errors ────────────────────────────────────────────────────────────────────
export type { ApplicationError, ApplicationErrorCode } from './application.errors';
export { errors as applicationErrors } from './application.errors';

// ── Mapper ────────────────────────────────────────────────────────────────────
export { mapApplicationFromBackend } from './application.mapper';
