/**
 * Errores del módulo Ofertas de Negociación.
 *
 * Cada error tiene:
 * - code: identificador para que el componente decida qué UI mostrar
 * - message: texto legible para el usuario (con call-to-action implícito)
 * - cause: detalle técnico para logs (no se muestra al usuario)
 */

export type NegotiationOfferErrorCode =
  | 'NO_OFFERS'
  | 'OFFER_NOT_FOUND'
  | 'OFFER_NOT_SIGNABLE'
  | 'OFFER_EXPIRED'
  | 'SESSION_EXPIRED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'VALIDATION_FAILED'
  | 'CONFLICT'
  | 'SIGN_FAILED';

export interface NegotiationOfferError {
  code: NegotiationOfferErrorCode;
  message: string;
  cause?: string;
}

export const errors = {
  noOffers: (): NegotiationOfferError => ({
    code: 'NO_OFFERS',
    message: 'No tienes ofertas de refinanciamiento en este momento.',
  }),

  offerNotFound: (id: string): NegotiationOfferError => ({
    code: 'OFFER_NOT_FOUND',
    message: 'La oferta que buscas no existe o ya no está disponible.',
    cause: `NegotiationOffer id="${id}" not found`,
  }),

  offerNotSignable: (): NegotiationOfferError => ({
    code: 'OFFER_NOT_SIGNABLE',
    message: 'Esta oferta ya no se puede firmar.',
  }),

  offerExpired: (): NegotiationOfferError => ({
    code: 'OFFER_EXPIRED',
    message: 'El plazo para firmar esta oferta ya venció. Contacta a soporte si necesitas una nueva.',
  }),

  sessionExpired: (): NegotiationOfferError => ({
    code: 'SESSION_EXPIRED',
    message: 'Tu sesión expiró. Vuelve a iniciar sesión para continuar.',
  }),

  networkError: (): NegotiationOfferError => ({
    code: 'NETWORK_ERROR',
    message: 'Error de conexión. Verifica tu internet e intenta de nuevo.',
  }),

  serverError: (status: number): NegotiationOfferError => ({
    code: 'SERVER_ERROR',
    message: 'No pudimos cargar tus ofertas. Intenta en unos minutos.',
    cause: `Backend returned HTTP ${status}`,
  }),

  validationFailed: (detail?: string): NegotiationOfferError => ({
    code: 'VALIDATION_FAILED',
    message: detail ?? 'Datos inválidos.',
  }),

  conflict: (detail?: string): NegotiationOfferError => ({
    code: 'CONFLICT',
    message: detail ?? 'Esta oferta ya no está disponible para esta acción.',
  }),

  signFailed: (detail?: string): NegotiationOfferError => ({
    code: 'SIGN_FAILED',
    message: detail ?? 'No se pudo firmar la oferta. Intenta de nuevo.',
  }),
};
