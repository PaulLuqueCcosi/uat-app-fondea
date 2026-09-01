/**
 * Service para gestión de contratos desde el admin.
 */

import { backendFetch } from '@/lib/backend-fetch';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface DocumentTypeRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  referenceType: 'LOAN_APPLICATION' | 'NEGOTIATION_OFFER';
  sortOrder: number;
  requiresSignature: boolean;
  visibleBeforeSignature: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface ContractTemplateVersion {
  id: string;
  code: string;
  documentTypeId: string;
  version: number;
  htmlContent: string;
  cssContent: string | null;
  active: boolean;
  createdBy: string;
  createdAt: string;
}

export type ContractVariableFormat = 'TEXT' | 'NUMBER' | 'CURRENCY' | 'DATE' | 'SCHEDULE' | 'SIGNATURE_BLOCK';

export interface ContractVariable {
  key: string;
  label: string;
  description: string;
  format: ContractVariableFormat;
  usage: string;
  /** true si aplica a cualquier tipo de documento, no solo al consultado. */
  universal: boolean;
}

// ── Document Types ────────────────────────────────────────────────────────────

export async function getDocumentTypes(): Promise<DocumentTypeRow[]> {
  const res = await backendFetch('/api/v1/admin/contracts/document-types', {
    context: 'ADMIN_CONTRACTS',
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getDocumentTypeById(id: string): Promise<DocumentTypeRow | null> {
  const all = await getDocumentTypes();
  return all.find((dt) => dt.id === id) ?? null;
}

export async function createDocumentType(data: {
  code: string;
  name: string;
  description?: string;
  referenceType: string;
  sortOrder?: number;
  requiresSignature: boolean;
  visibleBeforeSignature?: boolean;
}): Promise<DocumentTypeRow | null> {
  const res = await backendFetch('/api/v1/admin/contracts/document-types', {
    method: 'POST',
    body: JSON.stringify(data),
    context: 'ADMIN_CONTRACTS',
  });
  if (!res.ok) return null;
  return res.json();
}

export async function updateDocumentType(
  id: string,
  data: {
    name: string;
    description?: string;
    requiresSignature: boolean;
    visibleBeforeSignature?: boolean;
  },
): Promise<DocumentTypeRow | null> {
  const res = await backendFetch(`/api/v1/admin/contracts/document-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    context: 'ADMIN_CONTRACTS',
  });
  if (!res.ok) return null;
  return res.json();
}

export async function setDocumentTypeActive(id: string, active: boolean): Promise<boolean> {
  const res = await backendFetch(
    `/api/v1/admin/contracts/document-types/${id}/active?active=${active}`,
    { method: 'PATCH', context: 'ADMIN_CONTRACTS' },
  );
  return res.ok;
}

// ── Templates ─────────────────────────────────────────────────────────────────

export async function getTemplateVersions(documentTypeId: string): Promise<ContractTemplateVersion[]> {
  const res = await backendFetch(
    `/api/v1/admin/contracts/templates?documentTypeId=${encodeURIComponent(documentTypeId)}`,
    { context: 'ADMIN_CONTRACTS' },
  );
  if (!res.ok) return [];
  return res.json();
}

export async function getTemplateById(id: string): Promise<ContractTemplateVersion | null> {
  const res = await backendFetch(`/api/v1/admin/contracts/templates/${id}`, {
    context: 'ADMIN_CONTRACTS',
  });
  if (!res.ok) return null;
  return res.json();
}

export async function createTemplateVersion(data: {
  documentTypeId: string;
  code: string;
  htmlContent: string;
  cssContent?: string;
}): Promise<ContractTemplateVersion | null> {
  const res = await backendFetch('/api/v1/admin/contracts/templates', {
    method: 'POST',
    body: JSON.stringify(data),
    context: 'ADMIN_CONTRACTS',
  });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    console.error(`[ADMIN_CONTRACTS] Error ${res.status} al crear template:`, errorBody);
    return null;
  }
  return res.json();
}

export async function activateTemplate(id: string): Promise<boolean> {
  const res = await backendFetch(`/api/v1/admin/contracts/templates/${id}/activate`, {
    method: 'POST',
    context: 'ADMIN_CONTRACTS',
  });
  return res.ok;
}

// ── Variables ─────────────────────────────────────────────────────────────────

/** Catálogo cerrado de variables permitidas para este documentTypeId (universales + propias). */
export async function getContractVariables(documentTypeId: string): Promise<ContractVariable[]> {
  const res = await backendFetch(
    `/api/v1/admin/contracts/templates/variables?documentTypeId=${encodeURIComponent(documentTypeId)}`,
    { context: 'ADMIN_CONTRACTS' },
  );
  if (!res.ok) return [];
  return res.json();
}

/**
 * Renderiza HTML arbitrario con datos de ejemplo, pasando por el mismo validador que guardar
 * (incluye el filtro por documentTypeCode). Devuelve null si el HTML no pasa la validación —
 * el detalle del error queda en el body de la respuesta (ProblemDetail con `errors`).
 */
export async function previewContractTemplate(data: {
  htmlContent: string;
  cssContent?: string;
  documentTypeCode: string;
}): Promise<string | null> {
  const res = await backendFetch('/api/v1/admin/contracts/templates/preview', {
    method: 'POST',
    body: JSON.stringify(data),
    context: 'ADMIN_CONTRACTS',
  });
  if (!res.ok) return null;
  return res.text();
}
