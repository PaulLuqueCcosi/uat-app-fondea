'use server';

import { getLogtoContext, getAccessTokenRSC, signOut } from '@logto/next/server-actions';
import { redirect } from 'next/navigation';
import { logtoConfig } from '../logto';

/**
 * Devuelve el usuario autenticado o null si no hay sesión.
 * No redirige — útil para componentes que necesitan saber si hay usuario
 * sin forzar un redirect.
 */
export async function getUser() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated || !claims) {
    return null;
  }

  return {
    id: claims.sub || '',
    name: claims.name || claims.username || 'Usuario',
    email: claims.email || '',
    phone: claims.phone_number || '',
  };
}

/**
 * Verifica que haya sesión activa y devuelve el usuario.
 * Si no hay sesión, redirige a /api/logto/sign-in.
 *
 * Usar en layouts y páginas protegidas.
 * La validación real de tokens (refresh, expiración) la maneja el SDK de Logto
 * internamente a través de getLogtoContext().
 */
export async function requireValidSession() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated || !claims) {
    redirect('/api/logto/sign-in');
  }

  return {
    id: claims!.sub || '',
    name: claims!.name || claims!.username || 'Usuario',
    email: claims!.email || '',
    phone: claims!.phone_number || '',
  };
}

/**
 * Cierra la sesión del usuario.
 * signOut() limpia las cookies locales y redirige a Logto para cerrar la sesión SSO.
 * Logto luego redirige de vuelta según "Post Sign-out Redirect URIs" configurado en consola.
 */
export async function performSignOut() {
  await signOut(logtoConfig);
}

/**
 * Versión no-redirect de requireValidSession para usar en API routes.
 * Devuelve { valid, user, error } en lugar de redirigir.
 */
export async function validateSession() {
  try {
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

    if (!isAuthenticated || !claims) {
      return { valid: false, user: null, error: 'No session found' };
    }

    return {
      valid: true,
      user: {
        id: claims.sub || '',
        name: claims.name || claims.username || 'Usuario',
        email: claims.email || '',
        phone: claims.phone_number || '',
      },
      error: null,
    };
  } catch (error) {
    console.error('[AUTH] Session validation failed:', error);
    return { valid: false, user: null, error: 'Session expired or invalid' };
  }
}

/**
 * Validación estricta — verifica el token directamente contra el servidor de Logto.
 *
 * NOTA: Este patrón NO está en la documentación oficial de Logto.
 * Es una extensión custom para casos donde necesitás confirmar en tiempo real
 * que el usuario no fue suspendido o revocado desde Logto Console.
 *
 * La doc oficial solo recomienda getLogtoContext() para verificar sesión.
 * getAccessTokenRSC() está pensado para obtener tokens para llamar APIs externas,
 * no para validar sesión — y en RSC no persiste el token renovado en la cookie.
 * En Server Actions sí puede escribir cookies, por eso funciona acá.
 *
 * CUÁNDO TIENE SENTIDO USAR:
 *   - Antes de firmar un contrato de préstamo
 *   - Antes de operaciones financieras irreversibles
 *
 * RIESGO: Si Logto tiene un problema de red momentáneo, el usuario
 * es expulsado aunque su sesión sea válida. Considerarlo antes de usar.
 *
 * CUÁNDO NO USAR:
 *   - En layouts o páginas normales (agrega latencia de red en cada request)
 *   - En rutas de solo lectura
 */
export async function requireValidSessionStrict() {
  // Verificación local rápida primero
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated || !claims) {
    redirect('/api/logto/sign-in');
  }

  // Obtener el access token actual (el SDK lo refresca si expiró)
  let accessToken: string;
  try {
    accessToken = await getAccessTokenRSC(logtoConfig);
  } catch {
    redirect('/api/logto/sign-in');
  }

  // Validar el token directamente contra Logto
  try {
    const response = await fetch(`${logtoConfig.endpoint}/oidc/me`, {
      headers: { Authorization: `Bearer ${accessToken!}` },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      // 401 = sesión revocada o usuario suspendido en Logto Console
      console.warn('[AUTH] Strict validation failed — server rejected token', {
        status: response.status,
        userId: claims!.sub,
      });
      redirect('/api/logto/sign-in');
    }
  } catch (error: any) {
    // Timeout u error de red — en operaciones críticas fallamos seguro
    console.error('[AUTH] Strict validation network error', { message: error?.message });
    redirect('/api/logto/sign-in');
  }

  return {
    id: claims!.sub || '',
    name: claims!.name || claims!.username || 'Usuario',
    email: claims!.email || '',
    phone: claims!.phone_number || '',
  };
}
