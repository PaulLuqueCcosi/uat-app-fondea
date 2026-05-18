import { signIn } from '@logto/next/server-actions';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { logtoConfig } from '@/app/logto';

const INTENCION_COOKIE = 'fondea_intencion_id';

/**
 * GET /api/logto/sign-in?[params]
 *
 * Inicia el flujo de autenticación con Logto.
 *
 * Determina el postRedirectUri:
 *   1. ?intencion= en la URL (viene del middleware cuando no hay sesión)
 *   2. Cookie fondea_intencion_id (safety net: cuando el layout redirige aquí
 *      porque el token expiró — el middleware seteó la cookie con TTL corto)
 *   3. ?returnTo= en la URL
 *   4. /dashboard (fallback)
 *
 * Después de leer la cookie, la BORRA para que no contamine logins futuros.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const intencionFromUrl = searchParams.get('intencion');
  const returnTo         = searchParams.get('returnTo');
  const cookieStore      = await cookies();
  const intencionFromCookie = cookieStore.get(INTENCION_COOKIE)?.value;

  // Usar la intención y BORRAR la cookie inmediatamente
  const intencionId = intencionFromUrl ?? intencionFromCookie;
  if (intencionFromCookie) {
    cookieStore.delete(INTENCION_COOKIE);
  }

  let postRedirectUri: string;
  if (intencionId) {
    postRedirectUri = `${origin}/solicitar?intencion=${intencionId}`;
  } else if (returnTo) {
    postRedirectUri = `${origin}${returnTo}`;
  } else {
    postRedirectUri = `${origin}/dashboard`;
  }

  console.log('[AUTH:sign-in] →', {
    intencionFromUrl: intencionFromUrl ?? null,
    intencionFromCookie: intencionFromCookie ?? null,
    intencionId: intencionId ?? null,
    postRedirectUri,
  });

  await signIn(logtoConfig, {
    redirectUri: `${origin}/api/logto/callback`,
    postRedirectUri,
  });
}
