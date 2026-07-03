import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/backend-fetch';

const REFERRAL_COOKIE = 'fondea_referral_code';

/**
 * Ruta raíz — nunca muestra UI, solo redirige.
 *
 * Si llegamos aquí, el usuario YA está autenticado (el layout lo garantiza).
 *
 * Con ?intencion=ID → /solicitar?intencion=ID (registrar intención)
 * Con ?ref=CODE     → aplica referido y redirige a /dashboard
 * Sin params        → /dashboard
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;

  // Aplicar código de referido si viene en URL o cookie (usuario ya logueado)
  await applyReferralIfPresent();

  if (params.intencion) {
    const queryString = new URLSearchParams(params).toString();
    redirect(`/solicitar?${queryString}`);
  }

  redirect('/dashboard');
}

/**
 * Si hay un código de referido en cookie, intenta aplicarlo al usuario actual.
 * Fire-and-forget — no bloquea ni muestra error.
 */
async function applyReferralIfPresent(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const referralCode = cookieStore.get(REFERRAL_COOKIE)?.value;

    if (!referralCode) return;

    console.log(`[REFERRAL:page] código encontrado en cookie: ${referralCode} — aplicando...`);

    const res = await backendFetch('/api/v1/referidos/usar', {
      method: 'POST',
      body: JSON.stringify({ code: referralCode }),
      context: 'REFERRAL',
    });

    if (res.status === 200) {
      console.log(`[REFERRAL:page] ✅ código ${referralCode} aplicado exitosamente`);
    } else if (res.status === 409) {
      console.log(`[REFERRAL:page] ℹ️ usuario ya tiene un código aplicado (409)`);
    } else if (res.status === 400) {
      console.log(`[REFERRAL:page] ℹ️ código propio o inválido (400)`);
    } else if (res.status === 404) {
      console.log(`[REFERRAL:page] ℹ️ código ${referralCode} no existe (404)`);
    } else {
      console.log(`[REFERRAL:page] ⚠️ respuesta inesperada: ${res.status}`);
    }

    // Siempre limpiar la cookie (ya se procesó)
    cookieStore.delete(REFERRAL_COOKIE);
    console.log(`[REFERRAL:page] cookie eliminada`);
  } catch (error) {
    console.error('[REFERRAL:page] error:', error instanceof Error ? error.message : error);
  }
}
