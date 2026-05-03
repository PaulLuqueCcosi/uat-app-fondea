import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware global.
 *
 * Solo deja pasar las rutas de Logto (sign-in, callback) y archivos estáticos.
 * La verificación real de sesión la hace getLogtoContext() en app/layout.tsx.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto:
     * - _next/static  (archivos estáticos de Next.js)
     * - _next/image   (optimización de imágenes)
     * - favicon.ico
     * - api/logto     (rutas de autenticación de Logto)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/logto).*)',
  ],
};
