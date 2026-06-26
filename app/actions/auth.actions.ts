'use server';

import { getLogtoContext, getAccessTokenRSC, signOut } from '@logto/next/server-actions';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { logtoConfig } from '../logto';
import { backendFetch } from '@/lib/backend-fetch';

// ── Helper: sync de usuario con el backend ────────────────────────────────────

/**
 * Llama a POST /api/v1/users/sync con el JWT del usuario.
 * Si el usuario no existe en el backend, lo crea.
 * Si ya existe, lo devuelve tal cual.
 *
 * Llamar desde client components via server action antes de la primera
 * interacción con el backend (ej: en el dispatcher del funnel).
 *
 * Fire-and-forget: si falla, logueamos pero no bloqueamos el flujo.
 */
export async function syncUser(): Promise<void> {
  try {
    const res = await backendFetch('/api/v1/users/sync', {
      method: 'POST',
      context: 'AUTH_SYNC',
    });

    if (res.ok) {
      const status = res.status === 201 ? 'CREADO' : 'EXISTENTE';
      console.log(`[AUTH:sync] ✅ usuario sincronizado (${status})`);
    } else if (res.status === 409) {
      // 409 = el usuario ya existe en el backend — es éxito
      console.log('[AUTH:sync] ✅ usuario ya existe en el backend');
    } else {
      console.error(`[AUTH:sync] ❌ error ${res.status} al sincronizar usuario`);
    }
  } catch (error) {
    console.error('[AUTH:sync] ❌ network error:', error);
  }
}

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
    console.warn('[AUTH:session] no autenticado → /api/logto/sign-in');
    redirect('/api/logto/sign-in');
  }

  console.log('[AUTH:session] válida →', { userId: claims!.sub, email: claims!.email });

  return {
    id: claims!.sub || '',
    name: claims!.name || claims!.username || 'Usuario',
    email: claims!.email || '',
    phone: claims!.phone_number || '',
  };
}

/**
 * Valida sesión Y sincroniza usuario con el backend.
 * Usar SOLO en Server Actions (no en layouts/pages) porque syncUser
 * necesita poder escribir cookies (refresh token).
 */
export async function requireValidSessionAndSync() {
  const user = await requireValidSession();
  await syncUser();
  return user;
}

/**
 * Cierra la sesión del usuario.
 * signOut() limpia las cookies locales y redirige a Logto para cerrar la sesión SSO.
 * Logto luego redirige de vuelta según "Post Sign-out Redirect URIs" configurado en consola.
 */
export async function performSignOut() {
  console.log('[AUTH:sign-out] iniciando cierre de sesión');

  // Limpiar cookie de intención para que no contamine el próximo login
  const cookieStore = await cookies();
  cookieStore.delete('fondea_intencion_id');

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

// ── Admin role validation ─────────────────────────────────────────────────────

/**
 * Verifica que el usuario tenga rol ADMIN en el JWT.
 * El access token de Logto incluye `roles: ["ADMIN", "USER"]` en el payload.
 *
 * Si no es admin, redirige a /dashboard.
 * Si no hay sesión, redirige a sign-in.
 */
export async function requireAdminRole() {
  const user = await requireValidSession();

  try {
    // Obtener el access token para el API resource (contiene roles en el payload)
    const accessToken = await getAccessTokenRSC(logtoConfig, process.env.LOGTO_API_RESOURCE);

    if (!accessToken) {
      console.warn('[AUTH:admin] No se pudo obtener access token → /dashboard');
      redirect('/dashboard');
    }

    // Decodificar payload del JWT (sin verificar firma — ya fue validado por Logto)
    const payload = JSON.parse(
      Buffer.from(accessToken.split('.')[1], 'base64').toString('utf-8')
    );

    const roles: string[] = payload.roles ?? [];

    if (!roles.includes('ADMIN')) {
      console.warn('[AUTH:admin] Usuario sin rol ADMIN →', { userId: user.id, roles });
      redirect('/dashboard');
    }

    return { ...user, roles };
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('[AUTH:admin] Error validando rol:', error);
    redirect('/dashboard');
  }
}
