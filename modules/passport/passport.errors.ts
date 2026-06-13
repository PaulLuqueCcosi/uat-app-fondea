/**
 * Errores del módulo Pasaporte Financiero.
 *
 * Cada error tiene:
 * - code: identificador para que el componente decida qué UI mostrar
 * - message: texto legible para el usuario (con CTA implícito)
 * - cause: detalle técnico para logs (no se muestra)
 */

export type PassportErrorCode =
  | 'PASSPORT_UNAVAILABLE'
  | 'HISTORY_UNAVAILABLE'
  | 'SESSION_EXPIRED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR';

export interface PassportError {
  code: PassportErrorCode;
  message: string;
  cause?: string;
}

export const errors = {
  passportUnavailable: (detail?: string): PassportError => ({
    code: 'PASSPORT_UNAVAILABLE',
    message: 'No pudimos cargar tu pasaporte financiero. Intenta nuevamente.',
    cause: detail ?? 'Passport summary fetch failed',
  }),

  historyUnavailable: (detail?: string): PassportError => ({
    code: 'HISTORY_UNAVAILABLE',
    message: 'No pudimos cargar tu historial de puntos. Intenta nuevamente.',
    cause: detail ?? 'Points history fetch failed',
  }),

  sessionExpired: (): PassportError => ({
    code: 'SESSION_EXPIRED',
    message: 'Tu sesión expiró. Vuelve a iniciar sesión para continuar.',
    cause: 'Backend returned 401',
  }),

  networkError: (): PassportError => ({
    code: 'NETWORK_ERROR',
    message: 'Error de conexión. Verifica tu internet e intenta nuevamente.',
    cause: 'Network request failed',
  }),

  serverError: (status?: number): PassportError => ({
    code: 'SERVER_ERROR',
    message: 'Error en el servidor. Intenta en unos minutos.',
    cause: `Backend returned HTTP ${status ?? 'unknown'}`,
  }),
};
