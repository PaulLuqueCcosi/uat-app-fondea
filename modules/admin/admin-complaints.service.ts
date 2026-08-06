/**
 * Service para Reclamaciones — lado admin (M4 / R32).
 * Endpoint: GET /api/v1/admin/complaints
 */

import { backendFetch } from '@/lib/backend-fetch';
import type { SpringPage, Pagination } from './admin-users.types';
import type { AdminComplaintRow, ComplaintFilters } from './admin-complaints.types';

// ── Resultado ────────────────────────────────────────────────────────────────

export interface AdminComplaintsResult {
  data: AdminComplaintRow[];
  pagination: Pagination;
}

// ── Service ──────────────────────────────────────────────────────────────────

export async function getAdminComplaints(
  page: number,
  pageSize: number,
  filters: ComplaintFilters = {},
): Promise<AdminComplaintsResult> {
  const backendPage = Math.max(0, page - 1);

  const params = new URLSearchParams({
    page: String(backendPage),
    size: String(pageSize),
  });

  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  if (filters.onlyOverdue) params.set('onlyOverdue', 'true');
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortDir) params.set('sortDir', filters.sortDir);

  const res = await backendFetch(`/api/v1/admin/complaints?${params.toString()}`, {
    context: 'COMPLAINTS',
  });

  if (!res.ok) {
    console.error(`[COMPLAINTS] Error ${res.status} al listar reclamaciones`);
    return {
      data: [],
      pagination: { page, pageSize, totalItems: 0, totalPages: 0 },
    };
  }

  const body: SpringPage<any> = await res.json();

  const totalItems = body.page?.totalElements ?? body.totalElements ?? 0;
  const totalPages = body.page?.totalPages ?? body.totalPages ?? 0;

  const data: AdminComplaintRow[] = (body.content || []).map((row: any) => ({
    id: row.id,
    correlativeNumber: row.correlative_number,
    type: row.type,
    status: row.status,
    clientName: row.client_name ?? 'Sin nombre',
    clientDocument: row.client_document ?? '',
    productServiceDetail: row.product_service_detail ?? '',
    submittedDate: row.submitted_date,
    legalDeadline: row.legal_deadline,
    businessDaysElapsed: row.business_days_elapsed ?? 0,
    businessDaysRemaining: row.business_days_remaining ?? 0,
    isOverdue: row.is_overdue ?? false,
  }));

  return {
    data,
    pagination: { page, pageSize, totalItems, totalPages },
  };
}
