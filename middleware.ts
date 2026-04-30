import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('[MIDDLEWARE] Request to:', pathname);

  // Rutas públicas (no requieren auth)
  const publicPaths = [
    '/callback',
    '/api/iniciar',
    '/auth-error',
    '/test-auth', // Ruta de prueba
  ];

  // Rutas de API que no requieren middleware de auth
  const publicApiPaths = [
    '/api/iniciar',
    '/api/auth',
  ];

  // La ruta raíz "/" es especial - maneja su propia lógica de redirección
  if (pathname === '/' || publicPaths.includes(pathname) || publicApiPaths.some(path => pathname.startsWith(path))) {
    console.log('[MIDDLEWARE] Public path, allowing');
    return NextResponse.next();
  }

  // Verificar autenticación para rutas protegidas
  const cookies = request.cookies.getAll();
  console.log('[MIDDLEWARE] All cookies:', cookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`));

  // Buscar la cookie principal de sesión de Logto
  // Logto almacena toda la sesión en una sola cookie encriptada con el patrón: logto_<appId>
  const logtoSessionCookie = cookies.find(cookie => 
    cookie.name.startsWith('logto_') && 
    cookie.value && 
    cookie.value.length > 20 // Verificar que tenga contenido significativo
  );

  console.log('[MIDDLEWARE] Logto session cookie:', logtoSessionCookie ? logtoSessionCookie.name : 'not found');

  if (!logtoSessionCookie) {
    console.log('[MIDDLEWARE] No Logto session cookie found, redirecting to login');
    return NextResponse.redirect(new URL('/api/iniciar', request.url));
  }

  // Si la cookie de sesión existe y tiene contenido, asumimos que la sesión es válida
  // La validación real (expiración, refresh tokens, etc.) se hace en server-side con getLogtoContext()
  console.log('[MIDDLEWARE] Logto session cookie found, session appears valid');

  console.log('[MIDDLEWARE] Valid session found, allowing access');
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/solicitar/:path*',
    '/solicitudes/:path*',
    '/funnel/:path*'
  ],
};