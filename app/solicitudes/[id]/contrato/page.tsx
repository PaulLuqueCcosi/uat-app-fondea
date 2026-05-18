import { FunnelContract } from '@/components/solicitar/SolicitarContract';

export default async function ContratoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FunnelContract applicationId={id} />;
}
