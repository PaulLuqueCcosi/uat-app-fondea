export type NotificationErrorCode =
  | 'NOTIFICATIONS_UNAVAILABLE'
  | 'SESSION_EXPIRED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR';

export interface NotificationError {
  code: NotificationErrorCode;
  message: string;
  cause?: string;
}

export const errors = {
  unavailable: (detail?: string): NotificationError => ({
    code: 'NOTIFICATIONS_UNAVAILABLE',
    message: 'No pudimos cargar tus notificaciones. Intenta nuevamente.',
    cause: detail,
  }),
  sessionExpired: (): NotificationError => ({
    code: 'SESSION_EXPIRED',
    message: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  }),
  networkError: (): NotificationError => ({
    code: 'NETWORK_ERROR',
    message: 'Error de conexión. Verifica tu internet.',
  }),
  serverError: (status?: number): NotificationError => ({
    code: 'SERVER_ERROR',
    message: 'Error en el servidor. Intenta en unos minutos.',
    cause: `HTTP ${status ?? 'unknown'}`,
  }),
};
