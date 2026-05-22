'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSolicitudStore } from '@/lib/stores/solicitud-store';
import { FunnelContract } from '@/components/solicitar/SolicitarContract';

const ALLOWED_STATUSES = ['PRE_APPROVED', 'PENDING_DOCUMENTS', 'PENDING_SIGNATURE', 'APPROVED'];

export default function ContratoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const application = useSolicitudStore(s => s.application);
  const fetchContract = useSolicitudStore(s => s.fetchContract);

  useEffect(() => { fetchContract(); }, [fetchContract]);

  // Redirigir si el status no permite acceder a esta página
  useEffect(() => {
    if (application && !ALLOWED_STATUSES.includes(application.status)) {
      router.replace(`/solicitudes/${id}`);
    }
  }, [application, id, router]);

  return <FunnelContract applicationId={id} />;
}
