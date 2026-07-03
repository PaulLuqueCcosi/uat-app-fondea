import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const INTENCION_COOKIE = 'fondea_intencion_id';
const REFERRAL_COOKIE = 'fondea_referral_code';

/**
 * Middleware global.
 *
 * Dos responsabilidades:
 *
 * 1. PERSISTIR el intencionId en cookie httpOnly cuando llega en la URL.
 *    Esto garantiza que sobreviva el ciclo login/logout/login.
 *    Si ya hay una cookie de intencion, no la sobreescribe.
 *
 * 2. REDIRIGIR a sign-in cuando no hay sesión, pasando el intencionId
 *    desde la cookie (no solo desde la URL).
 *
 * La validación real de sesión (token, expiración) la hace getLogtoContext()
 * en app/layout.tsx — el middleware solo chequea presencia de cookie.
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams, origin } = request.nextUrl;

  // Rutas de Logto y estáticos — siempre pasar sin tocar
  if (
    pathname.startsWith('/api/logto') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const intencionFromUrl = searchParams.get('intencion');
  const referralFromUrl = searchParams.get('ref');

  // Log de referral si viene
  if (referralFromUrl) {
    console.log(`[REFERRAL:middleware] ?ref=${referralFromUrl} detectado en ${pathname}`);
  }

  // Verificar presencia de cookie de sesión Logto
  const hasSession = request.cookies.getAll().some(
    (c) => c.name.startsWith('logto_') && c.value.length > 20
  );

  if (hasSession) {
    const response = NextResponse.next();
    if (intencionFromUrl) {
      response.cookies.set(INTENCION_COOKIE, intencionFromUrl, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 5 * 60,
        path: '/',
      });
    }
    // Guardar código de referido si viene en URL (solo si no tiene uno ya)
    if (referralFromUrl && !request.cookies.get(REFERRAL_COOKIE)?.value) {
      response.cookies.set(REFERRAL_COOKIE, referralFromUrl, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 días
        path: '/',
      });
      console.log(`[REFERRAL:middleware] cookie guardada: ${referralFromUrl} (con sesión)`);
    }
    return response;
  }

  // ─── Sin sesión ─────────────────────────────────────────────────────────────
  // Necesitamos la cookie para que el intencionId sobreviva el ciclo OIDC

  if (intencionFromUrl) {
    // No hacemos NextResponse.next() aquí — vamos directo al redirect
    // La cookie se setea en el redirect response
  }

  const intencionFromCookie = request.cookies.get(INTENCION_COOKIE)?.value;
  const intencionId = intencionFromUrl ?? intencionFromCookie;

  const signInUrl = new URL('/api/logto/sign-in', origin);
  if (intencionId) {
    signInUrl.searchParams.set('intencion', intencionId);
  }

  console.log('[AUTH:middleware] sin sesión →', {
    from:       pathname,
    intencionId: intencionId ?? null,
    redirectTo: signInUrl.pathname + signInUrl.search,
  });

  const response = NextResponse.redirect(signInUrl);

  // Guardar en cookie para que sobreviva el ciclo OIDC
  if (intencionFromUrl) {
    response.cookies.set(INTENCION_COOKIE, intencionFromUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hora
      path: '/',
    });
    console.log('[AUTH:middleware] intencionId guardado en cookie →', intencionFromUrl);
  }

  // Guardar referral code para que sobreviva el ciclo OIDC
  if (referralFromUrl && !request.cookies.get(REFERRAL_COOKIE)?.value) {
    response.cookies.set(REFERRAL_COOKIE, referralFromUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/',
    });
    console.log(`[REFERRAL:middleware] cookie guardada: ${referralFromUrl} (sin sesión, pre-login)`);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Ejecutar el middleware en todas las rutas EXCEPTO:
     * - _next/static, _next/image  → assets internos de Next.js
     * - Archivos estáticos con extensión (logo.png, favicon.ico, *.svg, etc.)
     * - api/logto → rutas de auth (sign-in, callback) — nunca tocar
     */
    '/((?!_next/static|_next/image|api/logto|[^/]*\\.[^/]*$).*)',
  ],
};
