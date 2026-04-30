/**
 * Utilidades para manejo de autenticación y errores
 */

export interface AuthError {
  code: string;
  message: string;
  status?: number;
  timestamp: number;
}

export const AUTH_ERROR_CODES = {
  INVALID_GRANT: 'invalid_grant',
  SESSION_EXPIRED: 'session_expired',
  TOKEN_REFRESH_FAILED: 'token_refresh_failed',
  NETWORK_ERROR: 'network_error',
} as const;

/**
 * Determina si un error es recuperable (puede reintentarse)
 */
export function isRecoverableAuthError(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code?.toLowerCase() || '';
  
  // Errores que pueden resolverse con retry
  const recoverablePatterns = [
    'network',
    'timeout',
    'connection',
    'temporary',
    'rate_limit'
  ];
  
  return recoverablePatterns.some(pattern => 
    errorMessage.includes(pattern) || errorCode.includes(pattern)
  );
}

/**
 * Determina si un error requiere re-autenticación completa
 */
export function requiresReauth(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code?.toLowerCase() || '';
  
  // Errores que requieren login completo
  const reauthPatterns = [
    'invalid_grant',
    'invalid_token',
    'token_expired',
    'session_expired',
    'unauthorized',
    'access_denied'
  ];
  
  return reauthPatterns.some(pattern => 
    errorMessage.includes(pattern) || errorCode.includes(pattern)
  );
}

/**
 * Crea un objeto de error de autenticación estandarizado
 */
export function createAuthError(
  code: string, 
  message: string, 
  originalError?: any
): AuthError {
  return {
    code,
    message,
    status: originalError?.status,
    timestamp: Date.now(),
  };
}

/**
 * Logs de error de autenticación con contexto adicional
 */
export function logAuthError(error: AuthError, context?: Record<string, any>) {
  console.error('[AUTH_ERROR]', {
    ...error,
    context,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server',
  });
}

/**
 * Verifica si las cookies de Logto están presentes y válidas
 */
export function hasValidLogtoSession(): boolean {
  if (typeof document === 'undefined') return false;
  
  const cookies = document.cookie.split(';');
  const logtoCookies = cookies.filter(cookie => 
    cookie.trim().startsWith('logto:') || 
    cookie.trim().startsWith('logto_session')
  );
  
  return logtoCookies.length > 0;
}

/**
 * Limpia todas las cookies relacionadas con Logto
 */
export function clearLogtoClientCookies() {
  if (typeof document === 'undefined') return;
  
  const cookies = document.cookie.split(';');
  
  cookies.forEach(cookie => {
    const [name] = cookie.split('=');
    const trimmedName = name.trim();
    
    if (trimmedName.startsWith('logto:') || trimmedName.startsWith('logto_session')) {
      // Limpiar cookie en todos los paths posibles
      const paths = ['/', '/dashboard', '/solicitar'];
      paths.forEach(path => {
        document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
        document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${window.location.hostname}`;
      });
    }
  });
  
  // Limpiar localStorage relacionado
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.includes('logto') || key.includes('auth')) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.warn('[AUTH] No se pudo limpiar localStorage:', e);
  }
}