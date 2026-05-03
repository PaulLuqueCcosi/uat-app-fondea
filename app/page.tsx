import { getLogtoContext } from '@logto/next/server-actions';
import { redirect } from 'next/navigation';
import { logtoConfig } from './logto';

/**
 * Ruta raíz — nunca muestra UI, solo redirige.
 *
 * Autenticado + ?intencion=ID  → /solicitar?...
 * Autenticado                  → /dashboard
 * No autenticado + ?intencion  → /api/logto/sign-in?intencion=ID  (se preserva post-login)
 * No autenticado               → /api/logto/sign-in
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  const params = await searchParams;
  const queryString = new URLSearchParams(params).toString();

  if (isAuthenticated) {
    if (params.intencion) {
      console.log('[AUTH:page] autenticado + intencion → /solicitar');
      redirect(`/solicitar?${queryString}`);
    }
    console.log('[AUTH:page] autenticado → /dashboard');
    redirect('/dashboard');
  }

  if (queryString) {
    console.log('[AUTH:page] no autenticado + params → sign-in con params');
    redirect(`/api/logto/sign-in?${queryString}`);
  }

  console.log('[AUTH:page] no autenticado → sign-in');
  redirect('/api/logto/sign-in');
}
