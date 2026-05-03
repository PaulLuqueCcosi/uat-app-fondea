import { handleSignIn } from '@logto/next/server-actions';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logtoConfig } from '@/app/logto';

const INTENCION_COOKIE = 'fondea_intencion_id';

/**
 * GET /api/logto/callback
 *
 * Logto redirige aquí después de que el usuario se autentica.
 * handleSignIn() intercambia el código, guarda tokens en cookie,
 * y redirige al postRedirectUri si fue configurado en sign-in.
 *
 * También limpia la cookie de intencionId — ya fue consumida.
 */
export async function GET(request: NextRequest) {
  console.log('[AUTH:callback] recibido');

  try {
    // Limpiar la cookie de intencion — el postRedirectUri ya la tiene embebida
    const cookieStore = await cookies();
    cookieStore.delete(INTENCION_COOKIE);

    await handleSignIn(logtoConfig, new URL(request.url));

    // Solo llega acá si NO había postRedirectUri
    console.log('[AUTH:callback] sin postRedirectUri → /dashboard');
    redirect('/dashboard');

  } catch (error: any) {
    // NEXT_REDIRECT = handleSignIn hizo redirect via postRedirectUri — es normal
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      console.log('[AUTH:callback] postRedirectUri activo → redirigiendo');
      throw error;
    }

    console.error('[AUTH:callback] error en handleSignIn →', {
      message: error?.message,
      code:    error?.code,
      name:    error?.name,
    });

    return NextResponse.redirect(new URL('/api/logto/sign-in', request.url));
  }
}
