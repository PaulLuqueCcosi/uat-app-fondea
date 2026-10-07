// ─── Document Verification ───────────────────────────────────────────────────

export type DocumentType = 'DNI_FRONT' | 'DNI_BACK' | 'SELFIE';

export type DocumentVerificationStatus = 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED' | 'FAILED';

export type DocumentsOverallStatus = 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED';

export interface DocumentItemStatus {
  status: DocumentVerificationStatus;
  uploaded: boolean;
  rejectionReason: string | null;
  failedAttempts: number;
  maxAttempts: number;
  remainingAttempts: number;
}

export interface DocumentsVerificationStatus {
  id: string;
  applicationId: string;
  overallStatus: DocumentsOverallStatus;
  dniFront: DocumentItemStatus;
  dniBack: DocumentItemStatus;
  selfie: DocumentItemStatus;
  createdAt: string;
  updatedAt: string;
  /** Fin de la pausa temporal (hora de Perú, sin zona). null si no hay pausa. */
  blockedUntil: string | null;
  /** Cuándo podrá continuar. null con blockedUntil presente = la pre-aprobación vence antes. */
  canContinueAt: string | null;
  blockedStep: DocumentType | null;
}

/** Pausa temporal de la verificación de documentos (24 h tras agotar los intentos de un paso). */
export interface DocumentsPause {
  blockedUntil: string;
  /** null = la pre-aprobación vence antes de que termine la pausa */
  canContinueAt: string | null;
  expiresFirst: boolean;
}

// ─── Document Upload (respuesta de /documents) ───────────────────────────────

export type DocumentUploadStatus = 'PENDING' | 'UPLOADED' | 'FAILED' | 'REJECTED';

export interface DocumentInfo {
  id: string;
  type: DocumentType;
  fileName: string;
  fileSizeBytes: number;
  status: DocumentUploadStatus;
  uploadedAt: string;
}

export interface DocumentListResult {
  applicationId: string;
  documents: DocumentInfo[];
  allDocumentsUploaded: boolean;
}
