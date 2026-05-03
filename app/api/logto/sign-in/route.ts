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
 * Determina el postRedirectUri en este orden de prioridad:
 *   1. ?intencion= en la URL (viene del middleware con el param fresco)
 *   2. Cookie fondea_intencion_id (persiste entre login/logout)
 *   3. ?returnTo= en la URL
 *   4. /dashboard (fallback)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const intencionFromUrl    = searchParams.get('intencion');
  const returnTo            = searchParams.get('returnTo');
  const cookieStore         = await cookies();
  const intencionFromCookie = cookieStore.get(INTENCION_COOKIE)?.value;

  // Prioridad: URL > cookie > returnTo > dashboard
  const intencionId = intencionFromUrl ?? intencionFromCookie;

  let postRedirectUri: string;
  if (intencionId) {
    postRedirectUri = `${origin}/solicitar?intencion=${intencionId}`;
  } else if (returnTo) {
    postRedirectUri = `${origin}${returnTo}`;
  } else {
    postRedirectUri = `${origin}/dashboard`;
  }

  console.log('[AUTH:sign-in] →', {
    intencionFromUrl,
    intencionFromCookie,
    intencionId,
    postRedirectUri,
    redirectUri: `${origin}/api/logto/callback`,
  });

  await signIn(logtoConfig, {
    redirectUri: `${origin}/api/logto/callback`,
    postRedirectUri,
  });
}
