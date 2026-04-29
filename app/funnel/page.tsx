import { redirect } from 'next/navigation';

interface FunnelPageProps {
  searchParams: { intencion?: string };
}

export default function FunnelPage({ searchParams }: FunnelPageProps) {
  const intencionId = searchParams.intencion;

  // Redirige al primer paso del funnel, preservando el parámetro de intención
  if (intencionId) {
    redirect(`/funnel/labor?intencion=${intencionId}`);
  }

  redirect('/funnel/labor');
}
