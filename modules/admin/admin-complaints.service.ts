/**
 * Service para Reclamaciones — lado admin (M4 / R32).
 * Endpoints:
 * - GET  /api/v1/admin/complaints
 * - GET  /api/v1/admin/complaints/{id}
 * - POST /api/v1/admin/complaints/{id}/review
 * - POST /api/v1/admin/complaints/{id}/respond
 */

import { backendFetch } from '@/lib/backend-fetch';
import type { SpringPage, Pagination } from './admin-users.types';
import type { AdminComplaintRow, AdminComplaintDetail, ComplaintFilters } from './admin-complaints.types';

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

  if (filters.status) {
    params.set('status', Array.isArray(filters.status) ? filters.status.join(',') : filters.status);
  }
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

// ── Detalle ──────────────────────────────────────────────────────────────────

function mapDetail(row: any): AdminComplaintDetail {
  return {
    id: row.id,
    correlativeNumber: row.correlative_number,
    type: row.type,
    status: row.status,
    userId: row.user_id,
    relatedCreditId: row.related_credit_id ?? null,
    consumerName: row.consumer_name,
    consumerDocument: row.consumer_document,
    consumerPhone: row.consumer_phone ?? null,
    consumerEmail: row.consumer_email ?? null,
    productServiceDetail: row.product_service_detail,
    amountInvolved: row.amount_involved ?? null,
    complaintDetail: row.complaint_detail,
    consumerRequest: row.consumer_request,
    submittedDate: row.submitted_date,
    legalDeadline: row.legal_deadline,
    businessDaysElapsed: row.business_days_elapsed ?? 0,
    businessDaysRemaining: row.business_days_remaining ?? 0,
    isOverdue: row.is_overdue ?? false,
    responseText: row.response_text ?? null,
    respondedAt: row.responded_at ?? null,
    respondedBy: row.responded_by ?? null,
    wasRespondedLate: row.was_responded_late ?? null,
  };
}

export async function getAdminComplaintDetail(id: string): Promise<AdminComplaintDetail | null> {
  const res = await backendFetch(`/api/v1/admin/complaints/${id}`, {
    context: 'COMPLAINTS',
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    console.error(`[COMPLAINTS] Error ${res.status} al obtener detalle de reclamación ${id}`);
    return null;
  }

  return mapDetail(await res.json());
}

// ── Acciones ─────────────────────────────────────────────────────────────────

export interface ComplaintActionResult {
  ok: boolean;
  data?: AdminComplaintDetail;
  message?: string;
}

export async function markComplaintInReview(id: string): Promise<ComplaintActionResult> {
  const res = await backendFetch(`/api/v1/admin/complaints/${id}/review`, {
    method: 'POST',
    context: 'COMPLAINTS',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[COMPLAINTS] Error ${res.status} al marcar en revisión ${id}: ${body}`);
    return { ok: false, message: `Error al marcar en revisión: ${res.status}` };
  }

  return { ok: true, data: mapDetail(await res.json()) };
}

export async function respondComplaint(id: string, responseText: string): Promise<ComplaintActionResult> {
  const res = await backendFetch(`/api/v1/admin/complaints/${id}/respond`, {
    method: 'POST',
    context: 'COMPLAINTS',
    body: JSON.stringify({ response_text: responseText }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[COMPLAINTS] Error ${res.status} al responder reclamación ${id}: ${body}`);
    return { ok: false, message: `Error al responder: ${res.status}` };
  }

  return { ok: true, data: mapDetail(await res.json()) };
}
