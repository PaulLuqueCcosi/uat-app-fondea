/**
 * Errores del módulo Créditos.
 *
 * Cada error tiene:
 * - code: identificador para que el componente decida qué UI mostrar
 * - message: texto legible para el usuario (con call-to-action implícito)
 * - cause: detalle técnico para logs (no se muestra al usuario)
 */

export type CreditErrorCode =
  | 'NO_CREDITS'
  | 'CREDIT_NOT_FOUND'
  | 'INSTALLMENT_NOT_FOUND'
  | 'NO_ACTIVE_CREDIT'
  | 'NO_PENDING_PAYMENT'
  | 'SESSION_EXPIRED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'VALIDATION_FAILED'
  | 'PAYMENT_FAILED'
  | 'CONFLICT';

export interface CreditError {
  code: CreditErrorCode;
  message: string;
  cause?: string;
}

export const errors = {
  noCredits: (): CreditError => ({
    code: 'NO_CREDITS',
    message: 'Aún no tienes créditos desembolsados.',
  }),

  creditNotFound: (id: string): CreditError => ({
    code: 'CREDIT_NOT_FOUND',
    message: 'El crédito que buscas no existe o fue eliminado.',
    cause: `Credit id="${id}" not found`,
  }),

  installmentNotFound: (creditId: string, no: number): CreditError => ({
    code: 'INSTALLMENT_NOT_FOUND',
    message: 'La cuota que buscas no existe.',
    cause: `Installment #${no} of credit="${creditId}" not found`,
  }),

  noActiveCredit: (): CreditError => ({
    code: 'NO_ACTIVE_CREDIT',
    message: 'No tienes un crédito activo en este momento.',
  }),

  noPendingPayment: (): CreditError => ({
    code: 'NO_PENDING_PAYMENT',
    message: 'No tienes cuotas pendientes de pago. ¡Todo al día!',
  }),

  sessionExpired: (): CreditError => ({
    code: 'SESSION_EXPIRED',
    message: 'Tu sesión expiró. Vuelve a iniciar sesión para continuar.',
  }),

  networkError: (): CreditError => ({
    code: 'NETWORK_ERROR',
    message: 'Error de conexión. Verifica tu internet e intenta de nuevo.',
  }),

  serverError: (status: number): CreditError => ({
    code: 'SERVER_ERROR',
    message: 'No pudimos cargar tus créditos. Intenta en unos minutos.',
    cause: `Backend returned HTTP ${status}`,
  }),

  validationFailed: (detail?: string): CreditError => ({
    code: 'VALIDATION_FAILED',
    message: detail ?? 'Datos inválidos.',
  }),

  paymentFailed: (detail?: string): CreditError => ({
    code: 'PAYMENT_FAILED',
    message: detail ?? 'No se pudo procesar el pago. Intenta de nuevo.',
  }),

  conflict: (detail?: string): CreditError => ({
    code: 'CONFLICT',
    message: detail ?? 'Esta operación no se puede realizar ahora.',
  }),
};
