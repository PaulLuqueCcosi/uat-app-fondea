import { signIn } from '@logto/next/server-actions';
import { NextRequest, NextResponse } from 'next/server';
import { logtoConfig } from '@/app/logto';
import { cookies } from 'next/headers';

export const INTENCION_COOKIE = 'fondea_intencion_id';

/**
 * Cookie que guarda la URL completa de retorno post-login (path + query params).
 * Ejemplo: "/funnel?intencion=ABC123&otro=valor"
 */
export const RETURN_TO_COOKIE = 'fondea_return_to';

/**
 * GET /api/iniciar?[cualquier params]
 *
 * - Guarda todos los query params como "return_to" en cookie segura
 * - Si hay ?intencion=ID también lo guarda por separado
 * - Dispara el flujo de autenticación con Logto
 *
 * Al volver del proveedor, el callback lee las cookies y redirige al destino correcto.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const cookieStore = await cookies();

  const intencionId = searchParams.get('intencion');

  if (intencionId) {
    cookieStore.set(INTENCION_COOKIE, intencionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 30, // 30 minutos
      path: '/',
    });
  }

  // Guardar todos los params para reconstruir la URL de retorno
  const queryString = searchParams.toString();
  if (queryString) {
    const returnTo = intencionId
      ? `/solicitar?${queryString}`
      : `/?${queryString}`;

    cookieStore.set(RETURN_TO_COOKIE, returnTo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 30,
      path: '/',
    });
  }

  // Dispara el redirect a Logto — hace redirect() internamente
  await signIn(logtoConfig);

  // Nunca llega aquí
  return NextResponse.redirect(new URL('/', request.url));
}
