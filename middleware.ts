import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const INTENCION_COOKIE = 'fondea_intencion_id';

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

  const response = NextResponse.next();

  // 1. Si viene ?intencion= en la URL, guardarlo en cookie httpOnly
  //    para que sobreviva el ciclo de login/logout
  const intencionFromUrl = searchParams.get('intencion');
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

  // 2. Verificar presencia de cookie de sesión Logto
  const hasSession = request.cookies.getAll().some(
    (c) => c.name.startsWith('logto_') && c.value.length > 20
  );

  if (hasSession) {
    // Hay sesión → dejar pasar (con la cookie de intencion ya seteada si aplica)
    return response;
  }

  // Sin sesión → redirigir a sign-in
  // Prioridad: intencionId de la URL actual > intencionId de cookie previa
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

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/logto).*)',
  ],
};
