import { getLogtoContext } from '@logto/next/server-actions';
import { redirect } from 'next/navigation';
import { logtoConfig } from './logto';

/**
 * Ruta raíz — nunca muestra UI, solo redirige.
 *
 * - Autenticado + ?intencion=ID  → /solicitar?...  (preserva query params)
 * - Autenticado                  → /dashboard
 * - No autenticado               → /api/logto/sign-in  (manejado por layout.tsx)
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
      redirect(`/solicitar?${queryString}`);
    }
    redirect('/dashboard');
  }

  // No autenticado — el layout ya redirige a /api/logto/sign-in
  // pero por si acaso llegamos aquí directamente:
  redirect('/api/logto/sign-in');
}
