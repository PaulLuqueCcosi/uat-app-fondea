/**
 * Tipos para el detalle de usuario admin y sus formularios/expedientes.
 * Mapea la respuesta del backend de:
 * - GET /api/v1/admin/users/{userId}
 * - GET /api/v1/admin/users/{userId}/forms
 */

// ── User Detail ───────────────────────────────────────────────────────────────

export interface AdminUserDetailBackend {
  id: string;
  logtoId: string;
  firstName: string | null;
  secondName: string | null;
  paternalSurname: string | null;
  maternalSurname: string | null;
  additionalNames: string | null;
  documentType: string | null;
  documentNumber: string | null;
  nationality: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface AdminUserDetail {
  id: string;
  name: string;
  firstName: string | null;
  secondName: string | null;
  paternalSurname: string | null;
  maternalSurname: string | null;
  documentType: string | null;
  documentNumber: string | null;
  nationality: string | null;
  registeredAt: string;
  updatedAt: string | null;
}

// ── Forms/Expedientes ─────────────────────────────────────────────────────────

export interface FormSubmissionBackend {
  id: string;
  submittedAt: string;
  verificationResult: string | null;
  submissionData: string; // JSON string del backend
  ruleOutcomes: RuleOutcomeEntry[];
}

/** Traza de una regla evaluada en un intento fallido — de acá sale el motivo de rechazo real. */
export interface RuleOutcomeEntry {
  ruleCode: string;
  passed: boolean;
  message: string | null;
  evaluatedAt: string;
}

export interface FormSubmission {
  id: string;
  submittedAt: string;
  verificationResult: 'APPROVED' | 'REJECTED' | string;
  submissionData: Record<string, any>;
  /** @deprecated nunca se llenaba — usar ruleOutcomes */
  rejectionReason?: string;
  /** Vacío para envíos aprobados o rechazados de antes de esta trazabilidad. */
  ruleOutcomes: RuleOutcomeEntry[];
}

/** Una entrada del historial de verificaciones (VERIFIED/EXPIRED/REPLACED a lo largo del tiempo). */
export interface VerificationHistoryEntry {
  id: string;
  status: string;
  verifiedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

/** Forma en la que Spring serializa Page<T> — se usa tal cual para las tablas paginadas del admin. */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // página actual, 0-based
  size: number;
}

export interface FormLock {
  isBlocked: boolean;
  failedAttempts: number;
  maxAttempts: number;
  blockedAt?: string | null;
  blockedUntil: string | null;
  hoursRemaining?: number | null;
}

export interface FormModuleStatus {
  currentStatus: string;
  verifiedAt: string | null;
  expiresAt: string | null;
  totalSubmissions: number;
  lock: FormLock;
  submissions: FormSubmissionBackend[];
}

export interface AdminFormStatusBackend {
  userId: string;
  kyc: FormModuleStatus;
  labor: FormModuleStatus;
  economic: FormModuleStatus;
  references: FormModuleStatus;
  address: FormModuleStatus;
  bankAccount: FormModuleStatus;
}

export interface FormExpediente {
  currentStatus: string;
  verifiedAt: string | null;
  expiresAt: string | null;
  totalSubmissions: number;
  lock: FormLock;
  submissions: FormSubmission[];
}

export interface UserExpedientes {
  kyc: FormExpediente;
  labor: FormExpediente;
  economic: FormExpediente;
  references: FormExpediente;
  address: FormExpediente;
  bankAccount: FormExpediente;
}
