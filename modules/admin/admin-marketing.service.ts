/**
 * Service para la sección de Marketing y Adquisición (M5 — Referidos, R40).
 * Endpoints: /api/v1/admin/marketing/referrals*
 *
 * Los agregados chicos (R37-R39, R41) se consumen client-side vía el proxy
 * local /api/admin/marketing/analytics/* — no necesitan service server-side.
 */

import { backendFetch } from '@/lib/backend-fetch';
import type { Pagination } from './admin-users.types';
import type {
  ReferralSummary,
  ReferralSummaryBackend,
  ReferralRow,
  ReferralRowBackend,
} from './admin-marketing.types';

// ── R40a — Resumen ────────────────────────────────────────────────────────────

export async function getReferralSummary(from: string, to: string): Promise<ReferralSummary | null> {
  const params = new URLSearchParams({ from, to });

  const res = await backendFetch(`/api/v1/admin/marketing/referrals/summary?${params.toString()}`, {
    context: 'MARKETING_REFERRALS_SUMMARY',
  });

  if (!res.ok) {
    console.error(`[MARKETING] Error ${res.status} al obtener resumen de referidos`);
    return null;
  }

  const raw: ReferralSummaryBackend = await res.json();
  return {
    codesShared: raw.codes_shared,
    registrations: raw.registrations,
    firstLoanCompleted: raw.first_loan_completed,
    conversionRate: raw.conversion_rate,
    pointsAwarded: raw.points_awarded,
  };
}

// ── R40b — Listado paginado ───────────────────────────────────────────────────

export interface AdminReferralListResult {
  data: ReferralRow[];
  pagination: Pagination;
}

export async function getReferralList(
  page: number = 1,
  pageSize: number = 20,
  from: string,
  to: string,
): Promise<AdminReferralListResult> {
  const backendPage = Math.max(0, page - 1);

  const params = new URLSearchParams({
    page: String(backendPage),
    size: String(pageSize),
    from,
    to,
  });

  const res = await backendFetch(`/api/v1/admin/marketing/referrals?${params.toString()}`, {
    context: 'MARKETING_REFERRALS_LIST',
  });

  if (!res.ok) {
    console.error(`[MARKETING] Error ${res.status} al listar referidos`);
    return {
      data: [],
      pagination: { page, pageSize, totalItems: 0, totalPages: 0 },
    };
  }

  const body: { content: ReferralRowBackend[]; page?: { totalElements?: number; totalPages?: number }; totalElements?: number; totalPages?: number } = await res.json();

  const totalItems = body.page?.totalElements ?? body.totalElements ?? 0;
  const totalPages = body.page?.totalPages ?? body.totalPages ?? 0;

  const data: ReferralRow[] = (body.content || []).map((row) => ({
    referralUseId: row.referral_use_id,
    referrerUserId: row.referrer_user_id,
    referrerName: row.referrer_name,
    referredUserId: row.referred_user_id,
    referredName: row.referred_name,
    status: row.status,
    registeredAt: row.registered_at,
    completedAt: row.completed_at,
  }));

  return {
    data,
    pagination: { page, pageSize, totalItems, totalPages },
  };
}
