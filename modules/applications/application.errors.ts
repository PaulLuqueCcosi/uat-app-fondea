/**
 * Errores del módulo Solicitudes.
 */

export type ApplicationErrorCode =
  | 'APPLICATIONS_UNAVAILABLE'
  | 'APPLICATION_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR';

export interface ApplicationError {
  code: ApplicationErrorCode;
  message: string;
  cause?: string;
}

export const errors = {
  unavailable: (detail?: string): ApplicationError => ({
    code: 'APPLICATIONS_UNAVAILABLE',
    message: 'No pudimos cargar tus solicitudes. Intenta nuevamente.',
    cause: detail ?? 'Applications fetch failed',
  }),

  notFound: (id: string): ApplicationError => ({
    code: 'APPLICATION_NOT_FOUND',
    message: 'La solicitud no existe.',
    cause: `Application id="${id}" not found`,
  }),

  sessionExpired: (): ApplicationError => ({
    code: 'SESSION_EXPIRED',
    message: 'Tu sesión expiró. Vuelve a iniciar sesión.',
    cause: 'Backend returned 401',
  }),

  networkError: (): ApplicationError => ({
    code: 'NETWORK_ERROR',
    message: 'Error de conexión. Verifica tu internet e intenta nuevamente.',
    cause: 'Network request failed',
  }),

  serverError: (status?: number): ApplicationError => ({
    code: 'SERVER_ERROR',
    message: 'Error en el servidor. Intenta en unos minutos.',
    cause: `Backend returned HTTP ${status ?? 'unknown'}`,
  }),
};
