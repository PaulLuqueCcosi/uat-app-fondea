export type ReferralErrorCode =
  | 'REFERRALS_UNAVAILABLE'
  | 'SESSION_EXPIRED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'CODE_NOT_FOUND'
  | 'OWN_CODE'
  | 'ALREADY_APPLIED';

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
  codeNotFound: (): ReferralError => ({
    code: 'CODE_NOT_FOUND',
    message: 'El código de referido no existe. Verifica que esté bien escrito.',
  }),
  ownCode: (): ReferralError => ({
    code: 'OWN_CODE',
    message: 'No puedes usar tu propio código de referido.',
  }),
  alreadyApplied: (): ReferralError => ({
    code: 'ALREADY_APPLIED',
    message: 'Ya tienes un código de referido aplicado en tu cuenta.',
  }),
};
