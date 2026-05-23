// ─── Document Verification ───────────────────────────────────────────────────

export type DocumentType = 'DNI_FRONT' | 'DNI_BACK' | 'SELFIE';

export type DocumentVerificationStatus = 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED';

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
