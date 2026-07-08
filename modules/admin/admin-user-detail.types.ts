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
  documentType: string | null;
  documentNumber: string | null;
  registeredAt: string;
}

// ── Forms/Expedientes ─────────────────────────────────────────────────────────

export interface FormSubmissionBackend {
  id: string;
  submittedAt: string;
  verificationResult: string | null;
  submissionData: string; // JSON string del backend
}

export interface FormSubmission {
  id: string;
  submittedAt: string;
  verificationResult: 'APPROVED' | 'REJECTED' | string;
  submissionData: Record<string, any>;
  rejectionReason?: string;
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
