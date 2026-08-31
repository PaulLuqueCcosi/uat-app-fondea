/**
 * Errores del módulo Declaraciones de Pago.
 *
 * Cada error tiene:
 * - code: identificador para que el componente decida qué UI mostrar
 * - message: texto legible para el usuario (con call-to-action implícito)
 * - cause: detalle técnico para logs (no se muestra al usuario)
 */

export type PaymentDeclarationErrorCode =
  | 'NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'VALIDATION_FAILED'
  | 'SUBMIT_FAILED'
  | 'CONFLICT'
  | 'APPROVE_FAILED'
  | 'REJECT_FAILED'
  | 'QUOTE_FAILED';

export interface PaymentDeclarationError {
  code: PaymentDeclarationErrorCode;
  message: string;
  cause?: string;
}

export const errors = {
  notFound: (id: string): PaymentDeclarationError => ({
    code: 'NOT_FOUND',
    message: 'La declaración de pago que buscas no existe.',
    cause: `PaymentDeclaration id="${id}" not found`,
  }),

  sessionExpired: (): PaymentDeclarationError => ({
    code: 'SESSION_EXPIRED',
    message: 'Tu sesión expiró. Vuelve a iniciar sesión para continuar.',
  }),

  networkError: (): PaymentDeclarationError => ({
    code: 'NETWORK_ERROR',
    message: 'Error de conexión. Verifica tu internet e intenta de nuevo.',
  }),

  serverError: (status: number): PaymentDeclarationError => ({
    code: 'SERVER_ERROR',
    message: 'No pudimos cargar tus declaraciones de pago. Intenta en unos minutos.',
    cause: `Backend returned HTTP ${status}`,
  }),

  validationFailed: (detail?: string): PaymentDeclarationError => ({
    code: 'VALIDATION_FAILED',
    message: detail ?? 'Revisa los comprobantes ingresados — hay datos inválidos.',
  }),

  submitFailed: (detail?: string): PaymentDeclarationError => ({
    code: 'SUBMIT_FAILED',
    message: detail ?? 'No se pudo enviar la declaración de pago. Intenta de nuevo.',
  }),

  conflict: (detail?: string): PaymentDeclarationError => ({
    code: 'CONFLICT',
    message: detail ?? 'El monto no calza con la deuda actual del crédito. Revisa los montos e intenta de nuevo.',
  }),

  approveFailed: (detail?: string): PaymentDeclarationError => ({
    code: 'APPROVE_FAILED',
    message: detail ?? 'No se pudo aprobar la declaración. Intenta de nuevo.',
  }),

  rejectFailed: (detail?: string): PaymentDeclarationError => ({
    code: 'REJECT_FAILED',
    message: detail ?? 'No se pudo rechazar la declaración. Intenta de nuevo.',
  }),

  quoteFailed: (detail?: string): PaymentDeclarationError => ({
    code: 'QUOTE_FAILED',
    message: detail ?? 'No pudimos calcular la deuda hasta esta cuota. Recarga para reintentar.',
  }),
};
