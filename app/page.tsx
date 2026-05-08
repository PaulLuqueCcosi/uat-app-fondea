import { redirect } from 'next/navigation';

/**
 * Ruta raíz — nunca muestra UI, solo redirige.
 *
 * Si llegamos aquí, el usuario YA está autenticado (el layout lo garantiza).
 *
 * Con ?intencion=ID → /solicitar?intencion=ID (registrar intención)
 * Sin params        → /dashboard
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;

  if (params.intencion) {
    const queryString = new URLSearchParams(params).toString();
    redirect(`/solicitar?${queryString}`);
  }

  redirect('/dashboard');
}
