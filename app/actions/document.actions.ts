'use server';

import { requireValidSession } from './auth.actions';
import { backendFetch as _backendFetch } from '@/lib/backend-fetch';
import { parseBackendResponse, networkError } from '@/lib/action-utils';
import type { ActionResult } from '@/lib/types';
import type {
  DocumentType,
  DocumentInfo,
  DocumentListResult,
  DocumentsVerificationStatus,
  DocumentItemStatus,
} from '@/lib/types/document';

// ── Helpers ───────────────────────────────────────────────────────────────────

const backendFetch = (path: string, options?: RequestInit) =>
  _backendFetch(path, { ...options, context: 'DOCUMENT' });

function isSuccess(status: number): boolean {
  return status >= 200 && status < 300;
}

// ── Tipos de resultado ────────────────────────────────────────────────────────

export type UploadDocumentResult = ActionResult & (
  | {
      success: true;
      documentId: string;
      documentType: DocumentType;
      fileName: string;
      fileSizeBytes: number;
      uploadedAt: string;
      message?: string;
    }
  | { success: false }
);

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapDocumentInfo(raw: any): DocumentInfo {
  return {
    id: raw.id,
    type: raw.type,
    fileName: raw.file_name,
    fileSizeBytes: raw.file_size_bytes,
    status: raw.status,
    uploadedAt: raw.uploaded_at,
  };
}

function mapDocumentItemStatus(raw: any): DocumentItemStatus {
  return {
    status: raw.status,
    uploaded: raw.uploaded,
    rejectionReason: raw.rejectionReason ?? null,
    failedAttempts: raw.failedAttempts ?? raw.attempts ?? 0,
    maxAttempts: raw.maxAttempts,
    remainingAttempts: raw.remainingAttempts,
  };
}

function mapDocumentsVerificationStatus(raw: any): DocumentsVerificationStatus {
  return {
    id: raw.id,
    applicationId: raw.applicationId,
    overallStatus: raw.overallStatus,
    dniFront: mapDocumentItemStatus(raw.dniFront),
    dniBack: mapDocumentItemStatus(raw.dniBack),
    selfie: mapDocumentItemStatus(raw.selfie),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// ── Actions: Upload ───────────────────────────────────────────────────────────

/**
 * Sube un documento (DNI_FRONT, DNI_BACK o SELFIE) al backend.
 * POST /api/v1/applications/{applicationId}/documents/upload?type=...
 */
export async function uploadDocumentAction(
  applicationId: string,
  type: DocumentType,
  formData: FormData,
): Promise<UploadDocumentResult> {
  await requireValidSession();

  try {
    if (!applicationId?.trim()) {
      return {
        success: false,
        httpStatus: 0,
        errorCategory: 'validation',
        error: 'No se encontró la solicitud activa.',
      };
    }

    const res = await backendFetch(
      `/api/v1/applications/${applicationId}/documents/upload?type=${type}`,
      {
        method: 'POST',
        body: formData,
        headers: {},
      },
    );

    if (!isSuccess(res.status)) {
      return await parseBackendResponse(res) as Extract<ActionResult, { success: false }>;
    }

    const data = await res.json();

    return {
      success: true,
      httpStatus: res.status,
      documentId: data.document_id,
      documentType: data.document_type,
      fileName: data.file_name,
      fileSizeBytes: data.file_size_bytes,
      uploadedAt: data.uploaded_at,
      message: data.message,
    };
  } catch (error) {
    console.error('[DOCUMENT] Error al subir documento:', error);
    return networkError() as UploadDocumentResult;
  }
}

// ── Actions: List ─────────────────────────────────────────────────────────────

/**
 * Lista los documentos subidos para una solicitud.
 * GET /api/v1/applications/{applicationId}/documents
 */
export async function listDocumentsAction(
  applicationId: string,
): Promise<DocumentListResult | null> {
  await requireValidSession();

  try {
    const res = await backendFetch(`/api/v1/applications/${applicationId}/documents`);

    if (!isSuccess(res.status)) return null;

    const data = await res.json();

    return {
      applicationId: data.application_id,
      documents: (data.documents ?? []).map(mapDocumentInfo),
      allDocumentsUploaded: data.all_documents_uploaded ?? false,
    };
  } catch (error) {
    console.error('[DOCUMENT] Error al listar documentos:', error);
    return null;
  }
}

// ── Actions: URL ──────────────────────────────────────────────────────────────

/**
 * Obtiene la URL prefirmada de un documento para preview.
 * GET /api/v1/applications/{applicationId}/documents/{type}/url
 */
export async function getDocumentUrlAction(
  applicationId: string,
  type: DocumentType,
): Promise<string | null> {
  await requireValidSession();

  try {
    const res = await backendFetch(
      `/api/v1/applications/${applicationId}/documents/${type}/url`,
    );

    if (!isSuccess(res.status)) return null;

    const data = await res.json();
    return data.url ?? null;
  } catch (error) {
    console.error('[DOCUMENT] Error al obtener URL:', error);
    return null;
  }
}

// ── Actions: Delete ───────────────────────────────────────────────────────────

/**
 * Elimina un documento subido.
 * DELETE /api/v1/applications/{applicationId}/documents/{type}
 * Resetea la verificación a PENDING.
 */
export async function deleteDocumentAction(
  applicationId: string,
  type: DocumentType,
): Promise<ActionResult> {
  await requireValidSession();

  try {
    const res = await backendFetch(
      `/api/v1/applications/${applicationId}/documents/${type}`,
      { method: 'DELETE' },
    );

    if (!isSuccess(res.status)) {
      return await parseBackendResponse(res);
    }

    return { success: true, httpStatus: res.status };
  } catch (error) {
    console.error('[DOCUMENT] Error al eliminar documento:', error);
    return networkError();
  }
}

// ── Actions: Verification Status ──────────────────────────────────────────────

/**
 * Obtiene el estado de verificación de todos los documentos.
 * GET /api/v1/applications/{applicationId}/documents/status
 */
export async function getDocumentsVerificationStatusAction(
  applicationId: string,
): Promise<DocumentsVerificationStatus | null> {
  await requireValidSession();

  try {
    const res = await backendFetch(
      `/api/v1/applications/${applicationId}/documents/status`,
    );

    if (!isSuccess(res.status)) return null;

    const data = await res.json();
    return mapDocumentsVerificationStatus(data);
  } catch (error) {
    console.error('[DOCUMENT] Error al obtener estado de verificación:', error);
    return null;
  }
}

// ── Actions: Verify ───────────────────────────────────────────────────────────

export interface VerifyDocumentResult {
  success: boolean;
  documentsStatus?: DocumentsVerificationStatus;
  error?: string;
}

/**
 * Verifica un documento específico.
 * POST /api/v1/applications/{applicationId}/documents/verify/{type}
 *
 * Reglas del backend:
 * - SELFIE solo se puede verificar si DNI_FRONT y DNI_BACK ya están VERIFIED
 * - Máximo 5 intentos por documento
 * - Si se agotan los intentos → solicitud pasa a BLOCKED
 */
export async function verifyDocumentAction(
  applicationId: string,
  type: DocumentType,
): Promise<VerifyDocumentResult> {
  await requireValidSession();

  try {
    const res = await backendFetch(
      `/api/v1/applications/${applicationId}/documents/verify/${type}`,
      { method: 'POST' },
    );

    if (!isSuccess(res.status)) {
      let message = 'Error al verificar el documento.';
      try {
        const json = await res.json();
        message = json.detail ?? json.message ?? message;
      } catch {}

      return { success: false, error: message };
    }

    const data = await res.json();
    return {
      success: true,
      documentsStatus: mapDocumentsVerificationStatus(data),
    };
  } catch (error) {
    console.error('[DOCUMENT] Error al verificar documento:', error);
    return { success: false, error: 'Error de conexión al verificar.' };
  }
}
