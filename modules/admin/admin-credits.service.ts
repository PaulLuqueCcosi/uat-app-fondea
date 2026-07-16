/**
 * Service para listar créditos desde el admin.
 */

import { backendFetch } from '@/lib/backend-fetch';
import type { SpringPage, Pagination } from './admin-users.types';

// ── Tipos ───────────────────────────────────────────────────────────────────

export type CreditStatus = 'ACTIVE' | 'OVERDUE' | 'DEFAULTED' | 'PAID_OFF';

export interface AdminCreditRow {
  id: string;
  userId: string;
  userName: string | null;
  userDocument: string | null;
  applicationId: string;
  status: CreditStatus;
  principal: number;
  totalDue: number;
  installmentCount: number;
  disbursedAt: string | null;
  maturityDate: string;
  overdueSince: string | null;
  createdAt: string;
}

export interface AdminCreditsResult {
  data: AdminCreditRow[];
  pagination: Pagination;
}

// ── Service ─────────────────────────────────────────────────────────────────

export interface CreditFilters {
  search?: string;
  status?: CreditStatus;
  disbursedFrom?: string; // ISO date: YYYY-MM-DD
  disbursedTo?: string;
  overdueOnly?: boolean;
}

export async function getAdminCredits(
  page: number,
  pageSize: number,
  filters: CreditFilters = {},
): Promise<AdminCreditsResult> {
  const backendPage = Math.max(0, page - 1);

  const params = new URLSearchParams({
    page: String(backendPage),
    size: String(pageSize),
  });

  if (filters.search?.trim()) {
    params.set('search', filters.search.trim());
  }
  if (filters.status) {
    params.set('status', filters.status);
  }
  if (filters.disbursedFrom) {
    params.set('disbursedFrom', filters.disbursedFrom);
  }
  if (filters.disbursedTo) {
    params.set('disbursedTo', filters.disbursedTo);
  }
  if (filters.overdueOnly != null) {
    params.set('overdueOnly', String(filters.overdueOnly));
  }

  const res = await backendFetch(`/api/v1/admin/credits?${params.toString()}`, {
    context: 'ADMIN_CREDITS',
  });

  if (!res.ok) {
    console.error(`[ADMIN_CREDITS] Error ${res.status} al listar créditos`);
    return {
      data: [],
      pagination: { page, pageSize, totalItems: 0, totalPages: 0 },
    };
  }

  const body: SpringPage<AdminCreditRow> = await res.json();

  const responsePageSize = body.page?.size ?? body.size ?? 20;
  const totalItems = body.page?.totalElements ?? body.totalElements ?? 0;
  const totalPages = body.page?.totalPages ?? body.totalPages ?? 0;

  return {
    data: body.content,
    pagination: {
      page,
      pageSize: responsePageSize,
      totalItems,
      totalPages,
    },
  };
}

