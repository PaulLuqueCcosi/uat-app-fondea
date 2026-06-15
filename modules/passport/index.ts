// ── Service (lo que consumen las pages y actions) ────────────────────────────
export {
  getPassportSummary,
  getPointsHistory,
} from './passport.service';

// ── Types (para tipar props de componentes) ──────────────────────────────────
export type {
  PassportLevel,
  PassportLevelMeta,
  PassportSummary,
  PointsHistoryEntry,
  PointsMovementType,
} from './passport.types';

// ── Errors (para pattern matching en error states) ───────────────────────────
export type { PassportError, PassportErrorCode } from './passport.errors';
export { errors as passportErrors } from './passport.errors';

// ── Mapper (re-export para cuando se conecte el backend real) ────────────────
export {
  mapSummaryFromBackend,
  mapLevelFromBackend,
  mapHistoryEntryFromBackend,
} from './passport.mapper';
