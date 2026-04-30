import { getLogtoContext } from '@logto/next/server-actions';
import { redirect } from 'next/navigation';
import { logtoConfig } from './logto';

/**
 * Ruta raíz — nunca muestra UI, solo redirige:
 *
 * - Autenticado              → /dashboard  (preservando query params si los hay)
 * - No autenticado           → /api/iniciar (que guarda params y dispara Logto)
 *
 * Cualquier query param que llegue aquí se preserva en el flujo.
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
    const intencionId = params.intencion;
    if (intencionId) {
      // Autenticado + viene con intención → directo al solicitar
      redirect(`/solicitar?${queryString}`);
    }
    redirect('/dashboard');
  }

  // No autenticado → /api/iniciar guarda los params y dispara Logto
  if (queryString) {
    redirect(`/api/iniciar?${queryString}`);
  }

  // Sin params → login directo
  redirect('/api/iniciar');
}
