/**
 * Errores del módulo Perfil.
 *
 * Cada error tiene:
 * - code: identificador para que el componente decida qué UI mostrar
 * - message: texto legible para el usuario
 * - cause: detalle técnico para logs (no se muestra)
 */

export type ProfileErrorCode =
  | 'SESSION_EXPIRED'
  | 'PROFILE_NOT_FOUND'
  | 'IDENTITY_VERIFICATION_FAILED'
  | 'INVALID_CODE'
  | 'CODE_EXPIRED'
  | 'EMAIL_ALREADY_IN_USE'
  | 'PHONE_ALREADY_IN_USE'
  | 'PASSWORD_TOO_WEAK'
  | 'CANNOT_UNLINK'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN';

export interface ProfileError {
  code: ProfileErrorCode;
  message: string;
  cause?: string;
}

export const errors = {
  sessionExpired: (): ProfileError => ({
    code: 'SESSION_EXPIRED',
    message: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  }),

  profileNotFound: (): ProfileError => ({
    code: 'PROFILE_NOT_FOUND',
    message: 'No se pudo obtener tu perfil.',
  }),

  identityVerificationFailed: (): ProfileError => ({
    code: 'IDENTITY_VERIFICATION_FAILED',
    message: 'La verificación de identidad falló. Verifica tu contraseña.',
  }),

  invalidCode: (): ProfileError => ({
    code: 'INVALID_CODE',
    message: 'El código ingresado es incorrecto.',
  }),

  codeExpired: (): ProfileError => ({
    code: 'CODE_EXPIRED',
    message: 'El código ha expirado. Solicita uno nuevo.',
  }),

  emailAlreadyInUse: (): ProfileError => ({
    code: 'EMAIL_ALREADY_IN_USE',
    message: 'Este correo ya está registrado en otra cuenta.',
  }),

  phoneAlreadyInUse: (): ProfileError => ({
    code: 'PHONE_ALREADY_IN_USE',
    message: 'Este número ya está registrado en otra cuenta.',
  }),

  passwordTooWeak: (): ProfileError => ({
    code: 'PASSWORD_TOO_WEAK',
    message: 'La contraseña es muy débil. Usa al menos 8 caracteres con letras y números.',
  }),

  cannotUnlink: (detail?: string): ProfileError => ({
    code: 'CANNOT_UNLINK',
    message: detail ?? 'No puedes desvincular tu única forma de inicio de sesión.',
  }),

  networkError: (): ProfileError => ({
    code: 'NETWORK_ERROR',
    message: 'Error de conexión. Verifica tu internet.',
  }),

  serverError: (status?: number): ProfileError => ({
    code: 'SERVER_ERROR',
    message: 'Algo salió mal. Intenta en unos minutos.',
    cause: status ? `HTTP ${status}` : undefined,
  }),

  unknown: (cause?: string): ProfileError => ({
    code: 'UNKNOWN',
    message: 'Ocurrió un error inesperado.',
    cause,
  }),
};
