export type ReferralErrorCode =
  | 'REFERRALS_UNAVAILABLE'
  | 'SESSION_EXPIRED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR';

export interface ReferralError {
  code: ReferralErrorCode;
  message: string;
  cause?: string;
}

export const errors = {
  unavailable: (detail?: string): ReferralError => ({
    code: 'REFERRALS_UNAVAILABLE',
    message: 'No pudimos cargar tus referidos. Intenta nuevamente.',
    cause: detail,
  }),
  sessionExpired: (): ReferralError => ({
    code: 'SESSION_EXPIRED',
    message: 'Tu sesión expiró. Vuelve a iniciar sesión.',
    cause: 'Backend returned 401',
  }),
  networkError: (): ReferralError => ({
    code: 'NETWORK_ERROR',
    message: 'Error de conexión. Verifica tu internet.',
    cause: 'Network request failed',
  }),
  serverError: (status?: number): ReferralError => ({
    code: 'SERVER_ERROR',
    message: 'Error en el servidor. Intenta en unos minutos.',
    cause: `HTTP ${status ?? 'unknown'}`,
  }),
};
