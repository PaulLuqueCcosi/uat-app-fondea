'use server';

/**
 * Server Actions de Ofertas de Negociación — thin wrappers con autenticación.
 *
 * Responsabilidad: validar sesión y delegar al service.
 * NO tiene lógica propia.
 */

import { requireValidSession, requireAdminRole } from './auth.actions';
import * as negotiationOfferService from '@/modules/negotiation-offers/negotiation-offer.service';
import type {
  AcceptNegotiationOfferRequest,
  RejectNegotiationOfferRequest,
  CreateNegotiationOfferRequest,
  NegotiationOfferStatus,
} from '@/modules/negotiation-offers';

/** Todas las ofertas del usuario, más reciente primero */
export async function getMyNegotiationOffersAction() {
  await requireValidSession();
  return negotiationOfferService.getMyNegotiationOffers();
}

/** Detalle de una oferta + documentos a revisar */
export async function getNegotiationOfferByIdAction(id: string) {
  await requireValidSession();
  return negotiationOfferService.getNegotiationOfferById(id);
}

/** Firmar y aceptar la oferta */
export async function acceptNegotiationOfferAction(
  id: string,
  request: AcceptNegotiationOfferRequest,
) {
  await requireValidSession();
  return negotiationOfferService.acceptNegotiationOffer(id, request);
}

/** Rechazar la oferta */
export async function rejectNegotiationOfferAction(
  id: string,
  request: RejectNegotiationOfferRequest,
) {
  await requireValidSession();
  return negotiationOfferService.rejectNegotiationOffer(id, request);
}

// ── Admin ────────────────────────────────────────────────────────────────────

/** Todas las ofertas del sistema, filtrables por estado — requiere rol ADMIN */
export async function getAdminNegotiationOffersAction(status?: NegotiationOfferStatus) {
  await requireAdminRole();
  return negotiationOfferService.getAdminNegotiationOffers(status);
}

/** Historial de ofertas de una cuota específica — requiere rol ADMIN */
export async function getNegotiationOffersByInstallmentAction(installmentId: string) {
  await requireAdminRole();
  return negotiationOfferService.getNegotiationOffersByInstallment(installmentId);
}

/** Detalle de una oferta sin chequeo de ownership — requiere rol ADMIN */
export async function getAdminNegotiationOfferByIdAction(id: string) {
  await requireAdminRole();
  return negotiationOfferService.getAdminNegotiationOfferById(id);
}

/** Crea una oferta de negociación para una cuota en mora — requiere rol ADMIN */
export async function createNegotiationOfferAction(request: CreateNegotiationOfferRequest) {
  await requireAdminRole();
  return negotiationOfferService.createNegotiationOffer(request);
}
