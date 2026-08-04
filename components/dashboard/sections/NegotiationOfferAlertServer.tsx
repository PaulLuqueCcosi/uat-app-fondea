import { getMyNegotiationOffers, isOfferSignable } from '@/modules/negotiation-offers';
import { NegotiationOfferAlert } from './NegotiationOfferAlert';

/**
 * Server wrapper que obtiene las ofertas de negociación pendientes de firma.
 *
 * Puede haber más de una oferta SENT sin resolver simultáneamente (cuotas
 * distintas del mismo crédito pueden negociarse en paralelo) — no se asume
 * singular aunque hoy sea el caso más común.
 *
 * Hoy es el ÚNICO canal por el que el cliente se entera de una oferta nueva
 * (el correo real todavía no está implementado, solo queda un log interno) —
 * por eso este banner va bien visible en el home, no escondido.
 *
 * Si no hay ofertas firmables, no renderiza nada.
 */
export async function NegotiationOfferAlertServer() {
  const result = await getMyNegotiationOffers();
  if (!result.ok) return null;

  const pendingOffers = result.data.filter(isOfferSignable);
  if (pendingOffers.length === 0) return null;

  return <NegotiationOfferAlert offers={pendingOffers} />;
}
