/**
 * Service para gestión de Constancias de No Adeudo desde el admin.
 * Usa backendFetch (JWT con ROLE_ADMIN requerido en backend).
 */

import { backendFetch } from '@/lib/backend-fetch';
import type {
  CertificateSearchParams,
  CertificateStats,
  CertificateTemplateVersion,
  CertificateVariable,
  Pagination,
  PayoffCertificate,
  SpringPage,
} from './admin-constancias.types';

// ── Constancias ───────────────────────────────────────────────────────────────

export interface SearchCertificatesResult {
  data: PayoffCertificate[];
  pagination: Pagination;
}

export async function searchCertificates(params: CertificateSearchParams = {}): Promise<SearchCertificatesResult> {
  const backendPage = Math.max(0, params.page ?? 0);
  const size = params.size ?? 20;

  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.deliveryStatus) query.set('deliveryStatus', params.deliveryStatus);
  if (params.userId) query.set('userId', params.userId);
  query.set('page', String(backendPage));
  query.set('size', String(size));

  const res = await backendFetch(`/api/v1/admin/constancias?${query.toString()}`, {
    context: 'ADMIN_CONSTANCIAS',
  });
  if (!res.ok) {
    return { data: [], pagination: { page: backendPage + 1, pageSize: size, totalItems: 0, totalPages: 0 } };
  }

  const body: SpringPage<PayoffCertificate> = await res.json();
  const responsePageSize = body.page?.size ?? body.size ?? size;
  const totalItems = body.page?.totalElements ?? body.totalElements ?? 0;
  const totalPages = body.page?.totalPages ?? body.totalPages ?? 0;

  return {
    data: body.content,
    pagination: {
      page: backendPage + 1,
      pageSize: responsePageSize,
      totalItems,
      totalPages,
    },
  };
}

export async function getCertificateStats(): Promise<CertificateStats | null> {
  const res = await backendFetch('/api/v1/admin/constancias/stats', {
    context: 'ADMIN_CONSTANCIAS',
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getCertificateById(id: string): Promise<PayoffCertificate | null> {
  const res = await backendFetch(`/api/v1/admin/constancias/${id}`, {
    context: 'ADMIN_CONSTANCIAS',
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getCertificatesByCredit(creditId: string): Promise<PayoffCertificate[]> {
  const res = await backendFetch(`/api/v1/admin/constancias/by-credit/${creditId}`, {
    context: 'ADMIN_CONSTANCIAS',
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getCertificateDownloadUrl(id: string): Promise<string | null> {
  const res = await backendFetch(`/api/v1/admin/constancias/${id}/pdf`, {
    context: 'ADMIN_CONSTANCIAS',
  });
  if (!res.ok) return null;
  const body: { pdfUrl: string } = await res.json();
  return body.pdfUrl;
}

export async function reissueCertificate(creditId: string): Promise<PayoffCertificate | null> {
  const res = await backendFetch(`/api/v1/admin/constancias/by-credit/${creditId}/reissue`, {
    method: 'POST',
    context: 'ADMIN_CONSTANCIAS',
  });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    console.error(`[ADMIN_CONSTANCIAS] Error ${res.status} al reemitir:`, errorBody);
    return null;
  }
  return res.json();
}

/** Marca la constancia como enviada al cliente. Usado como "reenviar" mientras no exista el módulo de notificaciones real. */
export async function markCertificateDelivered(id: string): Promise<PayoffCertificate | null> {
  const res = await backendFetch(`/api/v1/admin/constancias/${id}/mark-delivered`, {
    method: 'POST',
    context: 'ADMIN_CONSTANCIAS',
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getPendingDeliveryCertificates(limit = 50): Promise<PayoffCertificate[]> {
  const res = await backendFetch(`/api/v1/admin/constancias/pending-delivery?limit=${limit}`, {
    context: 'ADMIN_CONSTANCIAS',
  });
  if (!res.ok) return [];
  return res.json();
}

// ── Template ──────────────────────────────────────────────────────────────────

const TEMPLATE_CODE = 'payoff-certificate';

export async function getCertificateTemplateVersions(code: string = TEMPLATE_CODE): Promise<CertificateTemplateVersion[]> {
  const res = await backendFetch(`/api/v1/admin/constancias/templates?code=${encodeURIComponent(code)}`, {
    context: 'ADMIN_CONSTANCIAS',
  });
  if (!res.ok) return [];
  return res.json();
}

export async function createCertificateTemplateVersion(data: {
  code: string;
  name?: string;
  htmlContent: string;
  cssContent?: string;
}): Promise<CertificateTemplateVersion | null> {
  const res = await backendFetch('/api/v1/admin/constancias/templates', {
    method: 'POST',
    body: JSON.stringify(data),
    context: 'ADMIN_CONSTANCIAS',
  });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    console.error(`[ADMIN_CONSTANCIAS] Error ${res.status} al crear versión de template:`, errorBody);
    return null;
  }
  return res.json();
}

export async function activateCertificateTemplate(id: string): Promise<boolean> {
  const res = await backendFetch(`/api/v1/admin/constancias/templates/${id}/activate`, {
    method: 'POST',
    context: 'ADMIN_CONSTANCIAS',
  });
  return res.ok;
}

export async function previewCertificateTemplate(data: {
  htmlContent: string;
  cssContent?: string;
}): Promise<string | null> {
  const res = await backendFetch('/api/v1/admin/constancias/templates/preview', {
    method: 'POST',
    body: JSON.stringify(data),
    context: 'ADMIN_CONSTANCIAS',
  });
  if (!res.ok) return null;
  return res.text();
}

export async function getCertificateVariables(): Promise<CertificateVariable[]> {
  const res = await backendFetch('/api/v1/admin/constancias/variables', {
    context: 'ADMIN_CONSTANCIAS',
  });
  if (!res.ok) return [];
  return res.json();
}
