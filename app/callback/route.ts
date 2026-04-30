import { handleSignIn } from '@logto/next/server-actions';
import { NextRequest, NextResponse } from 'next/server';
import { logtoConfig } from '../logto';
import { cookies } from 'next/headers';
import { INTENCION_COOKIE, RETURN_TO_COOKIE } from '@/app/api/iniciar/route';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  console.log('[CALLBACK] Processing OAuth callback...');
  console.log('[CALLBACK] Search params:', Object.fromEntries(searchParams.entries()));

  try {
    // Verificar cookies antes de handleSignIn
    const cookieStoreBefore = await cookies();
    const cookiesBefore = cookieStoreBefore.getAll();
    const logtoCookiesBefore = cookiesBefore.filter(c => c.name.includes('logto'));
    console.log('[CALLBACK] Logto cookies before handleSignIn:', logtoCookiesBefore.map(c => `${c.name}=${c.value.substring(0, 20)}...`));

    await handleSignIn(logtoConfig, searchParams);
    console.log('[CALLBACK] handleSignIn completed successfully');

    // Verificar cookies después de handleSignIn
    const cookieStoreAfter = await cookies();
    const cookiesAfter = cookieStoreAfter.getAll();
    const logtoCookiesAfter = cookiesAfter.filter(c => c.name.includes('logto'));
    console.log('[CALLBACK] Logto cookies after handleSignIn:', logtoCookiesAfter.map(c => c.name));

    const returnTo = cookieStoreAfter.get(RETURN_TO_COOKIE)?.value;
    const intencionId = cookieStoreAfter.get(INTENCION_COOKIE)?.value;

    // Limpiar cookies de navegación
    cookieStoreAfter.delete(RETURN_TO_COOKIE);
    cookieStoreAfter.delete(INTENCION_COOKIE);

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
  } catch (error: any) {
    console.error('[CALLBACK] Error durante handleSignIn:', error);
    console.error('[CALLBACK] Error details:', {
      message: error?.message,
      code: error?.code,
      name: error?.name
    });

    // Si es un error de state mismatch, limpiar cookies y reiniciar
    if (error?.code === 'callback_uri_verification.state_mismatched' || 
        error?.message?.includes('State mismatched')) {
      console.log('[CALLBACK] State mismatch detected, clearing cookies and restarting auth');
      
      try {
        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll();
        
        // Limpiar todas las cookies de Logto para reiniciar el estado
        allCookies.forEach(cookie => {
          if (cookie.name.includes('logto')) {
            cookieStore.delete(cookie.name);
          }
        });
        
        console.log('[CALLBACK] Cookies cleared, redirecting to restart auth');
      } catch (cleanupError) {
        console.error('[CALLBACK] Error cleaning up cookies:', cleanupError);
      }
    }
    
    return NextResponse.redirect(new URL('/api/iniciar', request.url));
  }
}
