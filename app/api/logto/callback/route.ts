import { handleSignIn } from '@logto/next/server-actions';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logtoConfig } from '@/app/logto';
import { backendFetch } from '@/lib/backend-fetch';

const INTENCION_COOKIE = 'fondea_intencion_id';

/**
 * GET /api/logto/callback
 *
 * Logto redirige aquí después de que el usuario se autentica.
 * handleSignIn() intercambia el código, guarda tokens en cookie,
 * y redirige al postRedirectUri si fue configurado en sign-in.
 *
 * Después de handleSignIn, sincronizamos el usuario con el backend
 * (POST /api/v1/users/sync). Esto solo ocurre una vez por login.
 */
export async function GET(request: NextRequest) {
  console.log('[AUTH:callback] recibido');

  try {
    // Limpiar la cookie de intencion — el postRedirectUri ya la tiene embebida
    const cookieStore = await cookies();
    cookieStore.delete(INTENCION_COOKIE);

    await handleSignIn(logtoConfig, new URL(request.url));

    // Solo llega acá si NO había postRedirectUri
    // Sincronizar usuario con el backend (fire-and-forget)
    await syncUserOnLogin();

    console.log('[AUTH:callback] sin postRedirectUri → /dashboard');
    redirect('/dashboard');

  } catch (error: any) {
    // NEXT_REDIRECT = handleSignIn hizo redirect via postRedirectUri — es normal
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      // Sincronizar usuario con el backend (fire-and-forget)
      // Se ejecuta antes de que el redirect se complete
      syncUserOnLogin().catch(() => {});
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

/**
 * Sincroniza el usuario con el backend.
 * Solo se llama una vez por login (en el callback).
 */
async function syncUserOnLogin(): Promise<void> {
  try {
    const res = await backendFetch('/api/v1/users/sync', {
      method: 'POST',
      context: 'AUTH_SYNC',
    });

    if (res.ok) {
      const status = res.status === 201 ? 'CREADO' : 'EXISTENTE';
      console.log(`[AUTH:sync] ✅ usuario sincronizado (${status})`);
    } else {
      console.error(`[AUTH:sync] ❌ error ${res.status}`);
    }
  } catch (error) {
    console.error('[AUTH:sync] ❌ network error:', error);
  }
}
