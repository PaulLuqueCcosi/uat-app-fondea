/**
 * Service para Customers analytics — R33 Churn Risk (server-side).
 * Endpoint: GET /api/v1/admin/customers/analytics/churn-risk
 */

import { backendFetch } from '@/lib/backend-fetch';
import type { SpringPage, Pagination } from './admin-users.types';
import type { ChurnRiskRow, ChurnRiskFilters } from './admin-customers.types';

// ── Resultado ────────────────────────────────────────────────────────────────

export interface AdminChurnRiskResult {
  data: ChurnRiskRow[];
  pagination: Pagination;
}

// ── Service ──────────────────────────────────────────────────────────────────

export async function getAdminChurnRisk(
  page: number,
  pageSize: number,
  filters: ChurnRiskFilters = {},
): Promise<AdminChurnRiskResult> {
  const backendPage = Math.max(0, page - 1);

  const params = new URLSearchParams({
    page: String(backendPage),
    size: String(pageSize),
  });

  if (filters.minDaysInactive) params.set('minDaysInactive', String(filters.minDaysInactive));
  if (filters.maxDaysInactive) params.set('maxDaysInactive', String(filters.maxDaysInactive));

  const res = await backendFetch(`/api/v1/admin/customers/analytics/churn-risk?${params.toString()}`, {
    context: 'CUSTOMERS_CHURN',
  });

  if (!res.ok) {
    console.error(`[CUSTOMERS] Error ${res.status} al listar riesgo de churn`);
    return {
      data: [],
      pagination: { page, pageSize, totalItems: 0, totalPages: 0 },
    };
  }

  const body: SpringPage<any> = await res.json();

  const totalItems = body.page?.totalElements ?? body.totalElements ?? 0;
  const totalPages = body.page?.totalPages ?? body.totalPages ?? 0;

  const data: ChurnRiskRow[] = (body.content || []).map((row: any) => ({
    userId: row.user_id,
    clientName: row.client_name ?? 'Sin nombre',
    clientDocument: row.client_document ?? '',
    passportLevel: row.passport_level ?? null,
    daysInactive: row.days_inactive ?? 0,
    lastCreditId: row.last_credit_id,
    lastCreditClosedAt: row.last_credit_closed_at,
  }));

  return {
    data,
    pagination: { page, pageSize, totalItems, totalPages },
  };
}
