/**
 * Service para reporte NPS (admin).
 * Endpoints:
 * - GET /api/v1/admin/nps/distribution
 * - GET /api/v1/admin/nps/users/{userId}/surveys
 * - GET /api/v1/admin/users?search={dni} (para resolver DNI → UUID)
 */

import { backendFetch } from '@/lib/backend-fetch';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NpsDistributionRange {
  min: number;
  max: number;
  count: number;
  percentage: number;
}

export interface NpsDistributionResponse {
  from: string;
  to: string;
  total_responses: number;
  ranges: NpsDistributionRange[];
}

export interface UserNpsSurveyItem {
  id: string;
  score: number;
  created_at: string;
}

export interface UserNpsSurveysResponse {
  user_id: string;
  from: string;
  to: string;
  min_score: number;
  max_score: number;
  total_elements: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  content: UserNpsSurveyItem[];
}

export interface AdminUserSummary {
  id: string;
  firstName: string | null;
  secondName: string | null;
  paternalSurname: string | null;
  maternalSurname: string | null;
  documentType: string | null;
  documentNumber: string | null;
  createdAt: string;
}

export interface NpsSurveysResult {
  data: UserNpsSurveyItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  userId: string | null;
  userName: string | null;
  documentNumber: string | null;
}

// ── Rangos por defecto ──────────────────────────────────────────────────────────

export const DEFAULT_NPS_RANGES = [
  { key: 'detractors', label: 'Detractores', min: 1, max: 6, color: 'red' as const, description: 'Clientes insatisfechos que pueden dañar la reputación con comentarios negativos.' },
  { key: 'passives', label: 'Pasivos', min: 7, max: 8, color: 'yellow' as const, description: 'Clientes satisfechos pero poco vinculados, vulnerables a irse con la competencia.' },
  { key: 'promoters', label: 'Promotores', min: 9, max: 10, color: 'green' as const, description: 'Clientes entusiastas y leales que recomendarán activamente el servicio.' },
];

export function formatRangesParam(ranges: { min: number; max: number }[]): string {
  return ranges.map((r) => `${r.min}-${r.max}`).join(',');
}

// ── API ─────────────────────────────────────────────────────────────────────────

export async function getNpsDistribution(
  ranges: { min: number; max: number }[] = DEFAULT_NPS_RANGES,
  from?: string,
  to?: string,
): Promise<NpsDistributionResponse | null> {
  const params = new URLSearchParams({
    ranges: formatRangesParam(ranges),
  });

  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const res = await backendFetch(`/api/v1/admin/nps/distribution?${params.toString()}`, {
    context: 'ADMIN_NPS_DISTRIBUTION',
  });

  if (!res.ok) {
    console.error(`[ADMIN_NPS_DISTRIBUTION] Error ${res.status}`);
    return null;
  }

  return res.json();
}

/**
 * Busca un usuario por DNI y devuelve su UUID y nombre.
 * Si no hay coincidencia, devuelve null.
 */
export async function findUserByDni(dni: string): Promise<AdminUserSummary | null> {
  const params = new URLSearchParams({
    search: dni.trim(),
    size: '10',
  });

  const res = await backendFetch(`/api/v1/admin/users?${params.toString()}`, {
    context: 'ADMIN_NPS_USER_SEARCH',
  });

  if (!res.ok) {
    console.error(`[ADMIN_NPS_USER_SEARCH] Error ${res.status}`);
    return null;
  }

  const body = await res.json();
  const users: AdminUserSummary[] = body.content ?? [];
  // Buscar coincidencia exacta de documentNumber
  return users.find((u) => u.documentNumber === dni.trim()) ?? null;
}

export function buildUserName(user: AdminUserSummary): string {
  const parts = [
    user.firstName,
    user.secondName,
    user.paternalSurname,
    user.maternalSurname,
  ].filter(Boolean);
  return parts.join(' ') || '—';
}

export async function getNpsUserSurveys(
  userId: string,
  page: number,
  pageSize: number,
  minScore: number,
  maxScore: number,
  from?: string,
  to?: string,
): Promise<NpsSurveysResult> {
  const backendPage = Math.max(0, page - 1);

  const params = new URLSearchParams({
    minScore: String(minScore),
    maxScore: String(maxScore),
    page: String(backendPage),
    size: String(pageSize),
  });

  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const res = await backendFetch(`/api/v1/admin/nps/users/${userId}/surveys?${params.toString()}`, {
    context: 'ADMIN_NPS_USER_SURVEYS',
  });

  if (!res.ok) {
    console.error(`[ADMIN_NPS_USER_SURVEYS] Error ${res.status}`);
    return {
      data: [],
      pagination: { page, pageSize, totalItems: 0, totalPages: 0 },
      userId: null,
      userName: null,
      documentNumber: null,
    };
  }

  const body: UserNpsSurveysResponse = await res.json();

  return {
    data: body.content,
    pagination: {
      page: body.current_page + 1,
      pageSize: body.page_size,
      totalItems: body.total_elements,
      totalPages: body.total_pages,
    },
    userId: body.user_id,
    userName: null,
    documentNumber: null,
  };
}
