'use server';

import { requireValidSession } from './auth.actions';
import {
  searchCertificates as _searchCertificates,
  getCertificateStats as _getCertificateStats,
  getCertificateById as _getCertificateById,
  getCertificatesByCredit as _getCertificatesByCredit,
  reissueCertificate as _reissueCertificate,
  markCertificateDelivered as _markCertificateDelivered,
  getPendingDeliveryCertificates as _getPendingDeliveryCertificates,
  getCertificateTemplateVersions as _getCertificateTemplateVersions,
  createCertificateTemplateVersion as _createCertificateTemplateVersion,
  activateCertificateTemplate as _activateCertificateTemplate,
  previewCertificateTemplate as _previewCertificateTemplate,
  getCertificateVariables as _getCertificateVariables,
  type SearchCertificatesResult,
  type CreateTemplateVersionResult,
  type CertificatePreviewResult,
} from '@/modules/admin/admin-constancias.service';
import type {
  CertificateSearchParams,
  CertificateStats,
  CertificateTemplateVersion,
  CertificateVariable,
  PayoffCertificate,
} from '@/modules/admin/admin-constancias.types';

// ── Constancias ───────────────────────────────────────────────────────────────

export async function searchCertificatesAction(params: CertificateSearchParams = {}): Promise<SearchCertificatesResult> {
  await requireValidSession();
  return _searchCertificates(params);
}

export async function getCertificateStatsAction(): Promise<CertificateStats | null> {
  await requireValidSession();
  return _getCertificateStats();
}

export async function getCertificateByIdAction(id: string): Promise<PayoffCertificate | null> {
  await requireValidSession();
  return _getCertificateById(id);
}

export async function getCertificatesByCreditAction(creditId: string): Promise<PayoffCertificate[]> {
  await requireValidSession();
  return _getCertificatesByCredit(creditId);
}

export async function reissueCertificateAction(creditId: string): Promise<PayoffCertificate | null> {
  await requireValidSession();
  return _reissueCertificate(creditId);
}

/** "Reenviar": marca la constancia como enviada. Placeholder hasta que exista el módulo real de notificaciones por correo. */
export async function markCertificateDeliveredAction(id: string): Promise<PayoffCertificate | null> {
  await requireValidSession();
  return _markCertificateDelivered(id);
}

export async function getPendingDeliveryCertificatesAction(limit = 50): Promise<PayoffCertificate[]> {
  await requireValidSession();
  return _getPendingDeliveryCertificates(limit);
}

// ── Template ──────────────────────────────────────────────────────────────────

export async function getCertificateTemplateVersionsAction(code?: string): Promise<CertificateTemplateVersion[]> {
  await requireValidSession();
  return _getCertificateTemplateVersions(code);
}

export async function createCertificateTemplateVersionAction(data: {
  code: string;
  name?: string;
  htmlContent: string;
  cssContent?: string;
}): Promise<CreateTemplateVersionResult> {
  await requireValidSession();
  return _createCertificateTemplateVersion(data);
}

export async function activateCertificateTemplateAction(id: string): Promise<boolean> {
  await requireValidSession();
  return _activateCertificateTemplate(id);
}

export async function previewCertificateTemplateAction(data: {
  htmlContent: string;
  cssContent?: string;
}): Promise<CertificatePreviewResult> {
  await requireValidSession();
  return _previewCertificateTemplate(data);
}

export async function getCertificateVariablesAction(): Promise<CertificateVariable[]> {
  await requireValidSession();
  return _getCertificateVariables();
}
