'use client';

import { useParams } from 'next/navigation';
import { FunnelContract } from '@/components/solicitar/SolicitarContract';

export default function ContratoPage() {
  const params = useParams();
  const id = params.id as string;
  return <FunnelContract applicationId={id} />;
}
