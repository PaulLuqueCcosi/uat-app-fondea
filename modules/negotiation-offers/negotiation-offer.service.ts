/**
 * Service de Ofertas de Negociación — conectado al backend real.
 *
 * Única puerta a los datos. Usa backendFetch para obtener datos,
 * mappers para transformarlos, y errors para los fallos.
 *
 * ⚠️ Este backend usa camelCase plano (a diferencia de `credits` que usa
 * snake_case) — ver nota en negotiation-offer.mapper.ts.
 *
 * Los componentes NUNCA importan de aquí — solo las pages y actions.
 */

import type { Result } from '@/modules/shared/result';
import type {
  NegotiationOffer,
  NegotiationOfferDetail,
  NegotiationOfferStatus,
  AcceptNegotiationOfferRequest,
  RejectNegotiationOfferRequest,
  CreateNegotiationOfferRequest,
} from './negotiation-offer.types';
import type { NegotiationOfferError } from './negotiation-offer.errors';
import { errors } from './negotiation-offer.errors';
import { backendFetch } from '@/lib/backend-fetch';
import {
  mapNegotiationOfferFromBackend,
  mapNegotiationOfferDetailFromBackend,
} from './negotiation-offer.mapper';

type NegotiationOfferResult<T> = Result<T> & (
  | { ok: true; data: T }
  | { ok: false; error: NegotiationOfferError }
);

const CTX = 'NEGOTIATION_OFFER';

// ─── Lectura ──────────────────────────────────────────────────────────────────

/**
 * Todas las ofertas del usuario autenticado, más reciente primero.
 * GET /api/v1/negotiation-offers/mine
 */
export async function getMyNegotiationOffers(): Promise<NegotiationOfferResult<NegotiationOffer[]>> {
  try {
    const res = await backendFetch('/api/v1/negotiation-offers/mine', { context: CTX });

    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    const offers = Array.isArray(raw) ? raw.map(mapNegotiationOfferFromBackend) : [];
    return { ok: true, data: offers };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

/**
 * Detalle de una oferta + documentos a revisar antes de firmar.
 * GET /api/v1/negotiation-offers/{id}
 */
export async function getNegotiationOfferById(
  id: string,
): Promise<NegotiationOfferResult<NegotiationOfferDetail>> {
  try {
    const res = await backendFetch(`/api/v1/negotiation-offers/${id}`, { context: CTX });

    if (res.status === 404) return { ok: false, error: errors.offerNotFound(id) };
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    return { ok: true, data: mapNegotiationOfferDetailFromBackend(raw) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

// ─── Acciones ─────────────────────────────────────────────────────────────────

/**
 * El cliente firma y acepta la oferta.
 * POST /api/v1/negotiation-offers/{id}/accept
 *
 * `resultingCreditId` puede venir null en esta misma respuesta — el crédito
 * se crea en un paso posterior asíncrono. Ver negotiation-offer.polling.ts
 * (o el hook de polling en el componente) para esperar a que esté listo.
 */
export async function acceptNegotiationOffer(
  id: string,
  request: AcceptNegotiationOfferRequest,
): Promise<NegotiationOfferResult<NegotiationOffer>> {
  try {
    const res = await backendFetch(`/api/v1/negotiation-offers/${id}/accept`, {
      context: CTX,
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (res.status === 400) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: errors.validationFailed(body.detail ?? body.message) };
    }
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status === 404) return { ok: false, error: errors.offerNotFound(id) };
    if (res.status === 409) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: errors.conflict(body.detail ?? body.message) };
    }
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.signFailed() };

    const raw = await res.json();
    return { ok: true, data: mapNegotiationOfferFromBackend(raw) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

// ─── Admin ──────────────────────────────────────────────────────────────────

/**
 * Todas las ofertas del sistema, más reciente primero — dashboard admin.
 * GET /api/v1/admin/negotiation-offers?status=SENT (status opcional)
 */
export async function getAdminNegotiationOffers(
  status?: NegotiationOfferStatus,
): Promise<NegotiationOfferResult<NegotiationOffer[]>> {
  try {
    const qs = status ? `?status=${status}` : '';
    const res = await backendFetch(`/api/v1/admin/negotiation-offers${qs}`, { context: CTX });

    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    const offers = Array.isArray(raw) ? raw.map(mapNegotiationOfferFromBackend) : [];
    return { ok: true, data: offers };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

/**
 * Historial completo de ofertas de una cuota específica (incluye
 * rechazadas/expiradas, no solo la vigente) — para mostrar "intentos
 * previos de negociación" en el detalle admin de la cuota.
 * GET /api/v1/admin/negotiation-offers/installment/{installmentId}
 */
export async function getNegotiationOffersByInstallment(
  installmentId: string,
): Promise<NegotiationOfferResult<NegotiationOffer[]>> {
  try {
    const res = await backendFetch(
      `/api/v1/admin/negotiation-offers/installment/${installmentId}`,
      { context: CTX },
    );

    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    const offers = Array.isArray(raw) ? raw.map(mapNegotiationOfferFromBackend) : [];
    return { ok: true, data: offers };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

/**
 * Detalle de una oferta + documentos, sin chequeo de ownership.
 * GET /api/v1/admin/negotiation-offers/{id}
 */
export async function getAdminNegotiationOfferById(
  id: string,
): Promise<NegotiationOfferResult<NegotiationOfferDetail>> {
  try {
    const res = await backendFetch(`/api/v1/admin/negotiation-offers/${id}`, { context: CTX });

    if (res.status === 404) return { ok: false, error: errors.offerNotFound(id) };
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    return { ok: true, data: mapNegotiationOfferDetailFromBackend(raw) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

/**
 * Crea una oferta de negociación para una cuota en mora. Cronograma 100%
 * manual — no se valida contra la deuda real de la cuota.
 * POST /api/v1/admin/negotiation-offers
 *
 * Validaciones del backend (devuelven 409 si fallan):
 * - La cuota debe estar status = OVERDUE
 * - Debe tener al menos N días de mora (configurable, default 5)
 * - No puede haber ya una oferta SENT sin resolver para esa cuota
 */
export async function createNegotiationOffer(
  request: CreateNegotiationOfferRequest,
): Promise<NegotiationOfferResult<NegotiationOffer>> {
  try {
    const res = await backendFetch('/api/v1/admin/negotiation-offers', {
      context: CTX,
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (res.status === 400) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: errors.validationFailed(body.detail ?? body.message) };
    }
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status === 404) return { ok: false, error: errors.offerNotFound(request.installmentId) };
    if (res.status === 409) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: errors.conflict(body.detail ?? body.message) };
    }
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    return { ok: true, data: mapNegotiationOfferFromBackend(raw) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}

/**
 * El cliente rechaza la oferta.
 * POST /api/v1/negotiation-offers/{id}/reject
 */
export async function rejectNegotiationOffer(
  id: string,
  request: RejectNegotiationOfferRequest,
): Promise<NegotiationOfferResult<NegotiationOffer>> {
  try {
    const res = await backendFetch(`/api/v1/negotiation-offers/${id}/reject`, {
      context: CTX,
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (res.status === 400) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: errors.validationFailed(body.detail ?? body.message) };
    }
    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status === 404) return { ok: false, error: errors.offerNotFound(id) };
    if (res.status === 409) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: errors.conflict(body.detail ?? body.message) };
    }
    if (res.status >= 500) return { ok: false, error: errors.serverError(res.status) };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    return { ok: true, data: mapNegotiationOfferFromBackend(raw) };
  } catch {
    return { ok: false, error: errors.networkError() };
  }
}
