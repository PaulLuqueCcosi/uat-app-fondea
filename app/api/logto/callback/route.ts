import { handleSignIn } from '@logto/next/server-actions';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logtoConfig } from '@/app/logto';
import { backendFetch } from '@/lib/backend-fetch';

const INTENCION_COOKIE = 'fondea_intencion_id';
const REFERRAL_COOKIE = 'fondea_referral_code';

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
      // Sincronizar usuario con el backend ANTES de dejar que el redirect continue.
      // handleSignIn ya guardó los tokens en cookie, así que backendFetch puede obtener el JWT.
      await syncUserOnLogin();
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
 * Si hay un código de referido en cookie, lo envía como query param.
 */
async function syncUserOnLogin(): Promise<void> {
  try {
    // Leer código de referido de la cookie (si existe)
    const cookieStore = await cookies();
    const referralCode = cookieStore.get(REFERRAL_COOKIE)?.value;

    const path = referralCode
      ? `/api/v1/users/sync?referralCode=${encodeURIComponent(referralCode)}`
      : '/api/v1/users/sync';

    console.log('[AUTH:sync] → POST', path);
    if (referralCode) {
      console.log(`[REFERRAL:sync] código de referido encontrado en cookie: ${referralCode}`);
    }

    const res = await backendFetch(path, {
      method: 'POST',
      context: 'AUTH_SYNC',
    });

    if (res.ok) {
      const status = res.status === 201 ? 'CREADO' : 'EXISTENTE';
      console.log(`[AUTH:sync] ✅ usuario sincronizado (${status})`);
      // Si se usó un código de referido y el usuario fue creado, limpiar la cookie
      if (referralCode && res.status === 201) {
        cookieStore.delete(REFERRAL_COOKIE);
        console.log(`[REFERRAL:sync] ✅ código ${referralCode} aplicado a usuario NUEVO → cookie eliminada`);
      } else if (referralCode && res.status === 200) {
        // Usuario ya existía — el backend intenta aplicar silenciosamente
        cookieStore.delete(REFERRAL_COOKIE);
        console.log(`[REFERRAL:sync] ℹ️ usuario ya existía, backend intentó aplicar código ${referralCode} → cookie eliminada`);
      }
    } else if (res.status === 409) {
      console.log('[AUTH:sync] ✅ usuario ya existe en el backend');
      if (referralCode) {
        cookieStore.delete(REFERRAL_COOKIE);
        console.log(`[REFERRAL:sync] ℹ️ 409 — cookie de referido eliminada`);
      }
    } else {
      const body = await res.text().catch(() => '');
      console.error(`[AUTH:sync] ❌ error ${res.status} — body: ${body.slice(0, 200)}`);
    }
  } catch (error) {
    console.error('[AUTH:sync] ❌ network error:', error instanceof Error ? error.message : error);
  }
}
