'use server';

import { requireValidSession } from './auth.actions';
import {
  createTemplateVersion as _createTemplateVersion,
  activateTemplate as _activateTemplate,
  createDocumentType as _createDocumentType,
  updateDocumentType as _updateDocumentType,
  setDocumentTypeActive as _setDocumentTypeActive,
  getContractVariables as _getContractVariables,
  previewContractTemplate as _previewContractTemplate,
} from '@/modules/admin/admin-contracts.service';
import type { ContractTemplateVersion, ContractVariable, DocumentTypeRow, PreviewResult } from '@/modules/admin/admin-contracts.service';

// ── Templates ─────────────────────────────────────────────────────────────────

export async function createTemplateVersionAction(data: {
  documentTypeId: string;
  code: string;
  htmlContent: string;
  cssContent?: string;
}): Promise<ContractTemplateVersion | null> {
  await requireValidSession();
  return _createTemplateVersion(data);
}

export async function activateTemplateAction(id: string): Promise<boolean> {
  await requireValidSession();
  return _activateTemplate(id);
}

// ── Document Types ────────────────────────────────────────────────────────────

export async function createDocumentTypeAction(data: {
  code: string;
  name: string;
  description?: string;
  referenceType: string;
  sortOrder?: number;
  requiresSignature: boolean;
  visibleBeforeSignature?: boolean;
}): Promise<DocumentTypeRow | null> {
  await requireValidSession();
  return _createDocumentType(data);
}

export async function updateDocumentTypeAction(
  id: string,
  data: {
    name: string;
    description?: string;
    requiresSignature: boolean;
    visibleBeforeSignature?: boolean;
  },
): Promise<DocumentTypeRow | null> {
  await requireValidSession();
  return _updateDocumentType(id, data);
}

export async function setDocumentTypeActiveAction(id: string, active: boolean): Promise<boolean> {
  await requireValidSession();
  return _setDocumentTypeActive(id, active);
}

// ── Variables ─────────────────────────────────────────────────────────────────

export async function getContractVariablesAction(documentTypeId: string): Promise<ContractVariable[]> {
  await requireValidSession();
  return _getContractVariables(documentTypeId);
}

export async function previewContractTemplateAction(data: {
  htmlContent: string;
  cssContent?: string;
  documentTypeCode: string;
}): Promise<PreviewResult> {
  await requireValidSession();
  return _previewContractTemplate(data);
}
