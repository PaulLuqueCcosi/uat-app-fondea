'use server';

import { requireValidSession } from './auth.actions';
import { backendFetch as _backendFetch } from '@/lib/backend-fetch';
import { parseBackendResponse, networkError } from '@/lib/action-utils';
import type { ActionResult } from '@/lib/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const backendFetch = (path: string, options?: RequestInit) =>
  _backendFetch(path, { ...options, context: 'DOCUMENT' });

function isSuccess(status: number): boolean {
  return status >= 200 && status < 300;
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type DocumentType = 'DNI_FRONT' | 'DNI_BACK' | 'SELFIE';

export type DocumentStatus = 'PENDING' | 'UPLOADED' | 'FAILED' | 'REJECTED';

export interface DocumentInfo {
  id: string;
  type: DocumentType;
  fileName: string;
  fileSizeBytes: number;
  status: DocumentStatus;
  uploadedAt: string;
}

export interface DocumentListResult {
  applicationId: string;
  documents: DocumentInfo[];
  allDocumentsUploaded: boolean;
}

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

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Sube un documento (DNI_FRONT, DNI_BACK o SELFIE) al backend.
 * POST /api/v1/applications/{applicationId}/documents/upload?type=...
 *
 * El backend espera multipart/form-data con un campo "file".
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

    // El backend espera el archivo en el campo "file" como multipart
    const res = await backendFetch(
      `/api/v1/applications/${applicationId}/documents/upload?type=${type}`,
      {
        method: 'POST',
        body: formData,
        // No setear Content-Type — fetch lo pone automáticamente con boundary para FormData
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

/**
 * Obtiene la URL de un documento para preview.
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
    // El backend devuelve un map { "url": "https://..." }
    return data.url ?? null;
  } catch (error) {
    console.error('[DOCUMENT] Error al obtener URL:', error);
    return null;
  }
}

/**
 * Elimina un documento subido.
 * DELETE /api/v1/applications/{applicationId}/documents/{type}
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
