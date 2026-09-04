// ── Service (lo que consumen las pages) ──────────────────────────────────────
export {
  getModuleSummaries,
  getModuleById,
  recordModuleAccess,
  getAdjacentModules,
} from './education.service';

// ── Types (para tipar props de componentes) ──────────────────────────────────
export type {
  EducationModule,
  EducationModuleSummary,
  Mascot,
  ExternalLink,
} from './education.types';

// ── Errors (para pattern matching en error states) ───────────────────────────
export type { EducationError, EducationErrorCode } from './education.errors';
