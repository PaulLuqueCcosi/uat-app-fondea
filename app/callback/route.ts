import { handleSignIn } from '@logto/next/server-actions';
import { NextRequest, NextResponse } from 'next/server';
import { logtoConfig } from '../logto';
import { cookies } from 'next/headers';
import { INTENCION_COOKIE, RETURN_TO_COOKIE } from '@/app/api/iniciar/route';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  console.log('[CALLBACK] Processing OAuth callback...');

  try {
    await handleSignIn(logtoConfig, searchParams);

    const cookieStore = await cookies();
    const returnTo = cookieStore.get(RETURN_TO_COOKIE)?.value;
    const intencionId = cookieStore.get(INTENCION_COOKIE)?.value;

    // Limpiar cookies
    cookieStore.delete(RETURN_TO_COOKIE);
    cookieStore.delete(INTENCION_COOKIE);

    if (returnTo) {
      console.log('[CALLBACK] Redirigiendo a:', returnTo);
      return NextResponse.redirect(new URL(returnTo, request.url));
    }

    if (intencionId) {
      console.log('[CALLBACK] intencionId encontrado:', intencionId);
      return NextResponse.redirect(new URL(`/solicitar?intencion=${intencionId}`, request.url));
    }

    console.log('[CALLBACK] Sin destino específico, redirigiendo al dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('[CALLBACK] Error durante handleSignIn:', error);
    return NextResponse.redirect(new URL('/api/iniciar', request.url));
  }
}
