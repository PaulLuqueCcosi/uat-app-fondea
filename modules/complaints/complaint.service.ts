/**
 * Service para reclamaciones — lado cliente.
 * Endpoints: /api/v1/complaints
 */

import { backendFetch } from '@/lib/backend-fetch';
import type {
  MyComplaint,
  SubmitComplaintRequest,
  ComplaintResult,
} from './complaint.types';

// ── Mapper (snake_case → camelCase) ──────────────────────────────────────────

function mapComplaint(raw: any): MyComplaint {
  return {
    id: raw.id,
    correlativeNumber: raw.correlative_number,
    type: raw.type,
    status: raw.status,
    productServiceDetail: raw.product_service_detail ?? '',
    complaintDetail: raw.complaint_detail ?? '',
    consumerRequest: raw.consumer_request ?? '',
    amountInvolved: raw.amount_involved ?? null,
    submittedDate: raw.submitted_date,
    legalDeadline: raw.legal_deadline,
    businessDaysElapsed: raw.business_days_elapsed ?? 0,
    businessDaysRemaining: raw.business_days_remaining ?? 0,
    isOverdue: raw.is_overdue ?? false,
    responseText: raw.response_text ?? null,
    respondedAt: raw.responded_at ?? null,
  };
}

// ── GET /api/v1/complaints — mis reclamaciones ───────────────────────────────

export async function getMyComplaints(): Promise<ComplaintResult<MyComplaint[]>> {
  const res = await backendFetch('/api/v1/complaints', {
    context: 'MY_COMPLAINTS',
  });

  if (res.status === 401) {
    return { ok: false, error: { code: 'SESSION_EXPIRED', message: 'Tu sesión expiró.' } };
  }

  if (!res.ok) {
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'No pudimos cargar tus reclamos.' } };
  }

  const body = await res.json();
  const complaints = (Array.isArray(body) ? body : body.content ?? []).map(mapComplaint);
  return { ok: true, data: complaints };
}

// ── GET /api/v1/complaints/{id} — detalle propio ─────────────────────────────

export async function getMyComplaintById(id: string): Promise<ComplaintResult<MyComplaint>> {
  const res = await backendFetch(`/api/v1/complaints/${id}`, {
    context: 'MY_COMPLAINT_DETAIL',
  });

  if (res.status === 404) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Reclamo no encontrado.' } };
  }

  if (!res.ok) {
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'Error al cargar el reclamo.' } };
  }

  const raw = await res.json();
  return { ok: true, data: mapComplaint(raw) };
}

// ── POST /api/v1/complaints — registrar nuevo ───────────────────────────────

export async function submitComplaint(request: SubmitComplaintRequest): Promise<ComplaintResult<MyComplaint>> {
  const res = await backendFetch('/api/v1/complaints', {
    method: 'POST',
    context: 'SUBMIT_COMPLAINT',
    body: JSON.stringify({
      type: request.type,
      related_credit_id: request.relatedCreditId || null,
      consumer_phone: request.consumerPhone,
      consumer_email: request.consumerEmail,
      product_service_detail: request.productServiceDetail,
      amount_involved: request.amountInvolved || null,
      complaint_detail: request.complaintDetail,
      consumer_request: request.consumerRequest,
    }),
  });

  if (res.status === 422) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: body.detail ?? 'Datos inválidos.' } };
  }

  if (!res.ok) {
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'No pudimos registrar tu reclamo.' } };
  }

  const raw = await res.json();
  return { ok: true, data: mapComplaint(raw) };
}
