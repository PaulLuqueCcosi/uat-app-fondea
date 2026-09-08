/**
 * Service de Declaraciones de Pago — conectado al backend real (módulo `depositos`).
 *
 * Única puerta a los datos. Usa backendFetch para obtener datos,
 * mappers para transformarlos, y errors para los fallos.
 *
 * Los componentes NUNCA importan de aquí — solo las pages y actions.
 */

import type { Result } from '@/modules/shared/result';
import type {
  AdminPaymentDeclarationListParams,
  ApprovePaymentDeclarationRequest,
  MyPaymentDeclarationDetail,
  PaymentDeclaration,
  PaymentDeclarationDetail,
  PaymentQuote,
  RejectPaymentDeclarationRequest,
} from './payment-declaration.types';
import type { PaymentDeclarationError } from './payment-declaration.errors';
import { errors } from './payment-declaration.errors';
import { backendFetch } from '@/lib/backend-fetch';
import {
  mapPaymentDeclarationFromBackend,
  mapPaymentDeclarationDetailFromBackend,
  mapMyPaymentDeclarationDetailFromBackend,
  mapPaymentQuoteFromBackend,
} from './payment-declaration.mapper';

type PaymentDeclarationResult<T> = Result<T> & (
  | { ok: true; data: T }
  | { ok: false; error: PaymentDeclarationError }
);

const CTX = 'PAYMENT_DECLARATION';

export interface PaginatedPaymentDeclarations {
  items: PaymentDeclaration[];
  totalElements: number;
  totalPages: number;
}

// ─── Declarar pago con comprobante ────────────────────────────────────────────

/**
 * Declara un pago adjuntando 1 a 5 comprobantes (fotos + N° de operación + monto).
 * Queda PENDING hasta que un admin la revise — no hay aplicación instantánea.
 *
 * POST /api/v1/payment-declarations (multipart/form-data)
 * Campos esperados en formData: creditId, installmentNo, photos[], operationNumbers[], amounts[]
 */
export async function submitPaymentDeclaration(
  formData: FormData,
): Promise<PaymentDeclarationResult<PaymentDeclaration>> {
  try {
    const res = await backendFetch('/api/v1/payment-declarations', {
      context: CTX,
      method: 'POST',
      body: formData,
      headers: {},
    });

    if (res.status === 400) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: errors.validationFailed(body.detail ?? body.message) };
    }
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: errors.submitFailed(body.detail ?? body.message) };
    }

    const raw = await res.json();
    return { ok: true, data: mapPaymentDeclarationFromBackend(raw) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

// ─── Lectura ──────────────────────────────────────────────────────────────────

/**
 * Declaraciones de pago del usuario autenticado, paginadas, más recientes primero.
 * GET /api/v1/payment-declarations?page=0&size=10
 *
 * No soporta filtro por creditId/installmentNo en el backend — para encontrar
 * la declaración de una cuota específica, pide una página grande y filtra
 * client-side por creditId + installmentNo.
 */
export async function listMyPaymentDeclarations(
  page: number,
  size: number,
): Promise<PaymentDeclarationResult<PaginatedPaymentDeclarations>> {
  try {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    const res = await backendFetch(`/api/v1/payment-declarations?${params.toString()}`, { context: CTX });

    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    return {
      ok: true,
      data: {
        items: (raw.content ?? []).map(mapPaymentDeclarationFromBackend),
        // Spring Data (Boot 4 / Spring Data 4) serializa Page<T> anidando la paginación
        // bajo "page" por defecto (serialization-mode via-dto) — content sigue plano.
        totalElements: raw.page?.totalElements ?? raw.totalElements ?? 0,
        totalPages: raw.page?.totalPages ?? raw.totalPages ?? 0,
      },
    };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

/**
 * Detalle de una declaración propia — incluye la foto de cada comprobante (URL prefirmada,
 * temporal). Antes usaba el mismo mapper que el listado (sin fotos): el cliente podía ver
 * que había declarado un pago pero nunca volver a ver la foto que subió.
 * GET /api/v1/payment-declarations/{id}
 */
export async function getMyPaymentDeclarationById(
  id: string,
): Promise<PaymentDeclarationResult<MyPaymentDeclarationDetail>> {
  try {
    const res = await backendFetch(`/api/v1/payment-declarations/${id}`, { context: CTX });

    if (res.status === 404) return { ok: false, error: errors.notFound(id) };
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    return { ok: true, data: mapMyPaymentDeclarationDetailFromBackend(raw) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

/**
 * Declaraciones de pago del sistema, paginadas y filtrables — dashboard admin.
 * GET /api/v1/admin/payment-declarations?page=0&size=20&status=PENDING&creditId=...&sortBy=createdAt&sortDir=desc
 *
 * `status` es repetible en la querystring (ej. ?status=PENDING&status=APPROVED).
 */
export async function listAdminPaymentDeclarations(
  params: AdminPaymentDeclarationListParams,
): Promise<PaymentDeclarationResult<PaginatedPaymentDeclarations>> {
  try {
    const qs = new URLSearchParams({ page: String(params.page), size: String(params.size) });
    (params.status ?? []).forEach((s) => qs.append('status', s));
    if (params.creditId) qs.set('creditId', params.creditId);
    if (params.sortBy) qs.set('sortBy', params.sortBy);
    if (params.sortDir) qs.set('sortDir', params.sortDir);

    const res = await backendFetch(`/api/v1/admin/payment-declarations?${qs.toString()}`, { context: CTX });

    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    return {
      ok: true,
      data: {
        items: (raw.content ?? []).map(mapPaymentDeclarationFromBackend),
        totalElements: raw.page?.totalElements ?? raw.totalElements ?? 0,
        totalPages: raw.page?.totalPages ?? raw.totalPages ?? 0,
      },
    };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

/**
 * Detalle completo de una declaración, sin chequeo de ownership — incluye
 * deuda calculada en vivo, comprobantes con foto, y aviso de duplicado.
 * GET /api/v1/admin/payment-declarations/{id}
 */
export async function getAdminPaymentDeclarationById(
  id: string,
): Promise<PaymentDeclarationResult<PaymentDeclarationDetail>> {
  try {
    const res = await backendFetch(`/api/v1/admin/payment-declarations/${id}`, { context: CTX });

    if (res.status === 404) return { ok: false, error: errors.notFound(id) };
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    return { ok: true, data: mapPaymentDeclarationDetailFromBackend(raw) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

/**
 * Aprueba una declaración de pago — aplica el pago de verdad sobre el crédito.
 * POST /api/v1/admin/payment-declarations/{id}/approve
 *
 * Si el backend rechaza (400/409 porque el monto no calza), la declaración
 * se queda en PENDING — no asumas éxito optimista en el caller.
 */
export async function approvePaymentDeclaration(
  id: string,
  request: ApprovePaymentDeclarationRequest,
): Promise<PaymentDeclarationResult<PaymentDeclarationDetail>> {
  try {
    const res = await backendFetch(`/api/v1/admin/payment-declarations/${id}/approve`, {
      context: CTX,
      method: 'POST',
      body: JSON.stringify({
        applied_amount: request.appliedAmount,
        // Solo se envían si el admin cambió la cuota objetivo — el backend exige el
        // motivo cuando difiere de la que declaró el cliente.
        target_installment_no: request.targetInstallmentNo,
        target_change_reason: request.targetChangeReason,
        admin_note: request.adminNote,
      }),
    });

    if (res.status === 400) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: errors.validationFailed(body.detail ?? body.message) };
    }
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status === 404) return { ok: false, error: errors.notFound(id) };
    if (res.status === 409) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: errors.conflict(body.detail ?? body.message) };
    }
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: errors.approveFailed(body.detail ?? body.message) };
    }

    const raw = await res.json();
    return { ok: true, data: mapPaymentDeclarationDetailFromBackend(raw) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

/**
 * Rechaza una declaración de pago — no aplica ningún pago.
 * POST /api/v1/admin/payment-declarations/{id}/reject
 */
export async function rejectPaymentDeclaration(
  id: string,
  request: RejectPaymentDeclarationRequest,
): Promise<PaymentDeclarationResult<PaymentDeclarationDetail>> {
  try {
    const res = await backendFetch(`/api/v1/admin/payment-declarations/${id}/reject`, {
      context: CTX,
      method: 'POST',
      body: JSON.stringify({
        client_message: request.clientMessage,
        internal_note: request.internalNote,
      }),
    });

    if (res.status === 400) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: errors.validationFailed(body.detail ?? body.message) };
    }
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status === 404) return { ok: false, error: errors.notFound(id) };
    if (res.status === 409) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: errors.conflict(body.detail ?? body.message) };
    }
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: errors.rejectFailed(body.detail ?? body.message) };
    }

    const raw = await res.json();
    return { ok: true, data: mapPaymentDeclarationDetailFromBackend(raw) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

// ─── Cotización de pago (módulo `credit`) ─────────────────────────────────────

/**
 * Cuánto se debe hasta una cuota objetivo.
 * GET /api/v1/admin/credits/{creditId}/installments/{installmentNo}/quote
 *
 * El admin necesita esto ANTES de aprobar un comprobante: si el cliente declaró la cuota
 * 4 pero también debe la 2 y la 3, el pago se aplica primero sobre esas. `maximumAllowed`
 * es el tope que el backend va a aceptar apuntando a esa cuota — aprobar por encima
 * devuelve 400 y la declaración queda PENDING.
 *
 * Vive en este módulo (no en `modules/credits`) porque el único consumidor es la pantalla
 * de aprobación de comprobantes.
 */
export async function getPaymentQuote(
  creditId: string,
  installmentNo: number,
): Promise<PaymentDeclarationResult<PaymentQuote>> {
  try {
    const res = await backendFetch(
      `/api/v1/admin/credits/${creditId}/installments/${installmentNo}/quote`,
      { context: CTX },
    );

    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status === 404) return { ok: false, error: errors.notFound(creditId) };
    if (res.status === 400 || res.status === 409) {
      // La cuota no es cobrable (ya PAID, o NEGOTIATED) — el backend explica cuál es.
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: errors.quoteFailed(body.detail ?? body.message) };
    }
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.quoteFailed() };

    const raw = await res.json();
    return { ok: true, data: mapPaymentQuoteFromBackend(raw) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}
