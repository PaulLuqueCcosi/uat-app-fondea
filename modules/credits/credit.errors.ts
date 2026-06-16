/**
 * Errores del módulo Créditos.
 *
 * Cada error tiene:
 * - code: identificador para que el componente decida qué UI mostrar
 * - message: texto legible para el usuario (con call-to-action implícito)
 * - cause: detalle técnico para logs (no se muestra al usuario)
 */

export type CreditErrorCode =
  | 'CREDITS_EMPTY'
  | 'CREDIT_NOT_FOUND'
  | 'INSTALLMENT_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'VALIDATION_FAILED'
  | 'CONFLICT';

export interface CreditError {
  code: CreditErrorCode;
  message: string;
  cause?: string;
}

export const errors = {
  empty: (): CreditError => ({
    code: 'CREDITS_EMPTY',
    message: 'Aún no tienes créditos desembolsados.',
  }),

  creditNotFound: (id: string): CreditError => ({
    code: 'CREDIT_NOT_FOUND',
    message: 'El crédito que buscas no existe o fue eliminado.',
    cause: `Credit id="${id}" not found`,
  }),

  installmentNotFound: (id: string): CreditError => ({
    code: 'INSTALLMENT_NOT_FOUND',
    message: 'La cuota que buscas no existe.',
    cause: `Installment id="${id}" not found`,
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

  conflict: (detail?: string): CreditError => ({
    code: 'CONFLICT',
    message: detail ?? 'Esta operación no se puede realizar ahora.',
  }),
};
