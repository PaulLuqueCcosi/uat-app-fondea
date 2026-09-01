/**
 * Errores del módulo de cuenta de depósito.
 *
 * <p>Cada mensaje incluye la siguiente acción para el usuario. El caso importante es
 * `NOT_CONFIGURED`: si el admin nunca cargó una cuenta, el cliente no puede depositar y
 * hay que decírselo con una salida (contactar soporte), no dejar la pantalla vacía.
 */

export type DepositAccountErrorCode =
  | 'NOT_CONFIGURED'
  | 'SESSION_EXPIRED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'UPLOAD_FAILED';

export interface DepositAccountError {
  code: DepositAccountErrorCode;
  /** Para el usuario — se muestra en la UI. */
  message: string;
  /** Para devs/logs — no se muestra. */
  cause?: string;
}

export const errors = {
  notConfigured: (): DepositAccountError => ({
    code: 'NOT_CONFIGURED',
    message:
      'Todavía no hay una cuenta de depósito configurada. Escríbenos por WhatsApp para que te indiquemos cómo pagar.',
  }),
  sessionExpired: (): DepositAccountError => ({
    code: 'SESSION_EXPIRED',
    message: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  }),
  networkError: (): DepositAccountError => ({
    code: 'NETWORK_ERROR',
    message: 'Error de conexión. Verifica tu internet e intenta de nuevo.',
  }),
  serverError: (status: number): DepositAccountError => ({
    code: 'SERVER_ERROR',
    message: 'No pudimos cargar los datos de la cuenta. Intenta en unos minutos.',
    cause: `Backend returned HTTP ${status}`,
  }),
  validationFailed: (detail?: string): DepositAccountError => ({
    code: 'VALIDATION_FAILED',
    message: detail ?? 'Revisa los datos ingresados.',
  }),
  notFound: (id: string): DepositAccountError => ({
    code: 'NOT_FOUND',
    message: 'La cuenta que buscas no existe.',
    cause: `Config id="${id}" not found`,
  }),
  uploadFailed: (detail?: string): DepositAccountError => ({
    code: 'UPLOAD_FAILED',
    message: detail ?? 'No se pudo subir la imagen del QR. Intenta de nuevo.',
  }),
};
