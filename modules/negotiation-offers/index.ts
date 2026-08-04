// ── Service (lo que consumen las pages y actions) ────────────────────────────
export {
  getMyNegotiationOffers,
  getNegotiationOfferById,
  acceptNegotiationOffer,
  rejectNegotiationOffer,
  getAdminNegotiationOffers,
  getNegotiationOffersByInstallment,
  getAdminNegotiationOfferById,
  createNegotiationOffer,
} from './negotiation-offer.service';

// ── Types (para tipar props de componentes) ──────────────────────────────────
export type {
  NegotiationOffer,
  NegotiationOfferDetail,
  NegotiationOfferDocument,
  NegotiationOfferStatus,
  NegotiationScheduleItem,
  AcceptNegotiationOfferRequest,
  RejectNegotiationOfferRequest,
  CreateNegotiationOfferRequest,
} from './negotiation-offer.types';

export {
  negotiationOfferStatusLabels,
  isOfferSignable,
  isOfferStaleExpired,
  formatDeadlineUrgency,
} from './negotiation-offer.types';

// ── Errors (para pattern matching en error states) ───────────────────────────
export type { NegotiationOfferError, NegotiationOfferErrorCode } from './negotiation-offer.errors';

// ── Mapper (para uso directo si se necesita) ─────────────────────────────────
export {
  mapNegotiationOfferFromBackend,
  mapNegotiationOfferDetailFromBackend,
} from './negotiation-offer.mapper';
