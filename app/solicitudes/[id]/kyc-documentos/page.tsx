'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSolicitudStore } from '@/lib/stores/solicitud-store';
import { FunnelKYCDocuments } from '@/components/forms/solicitar/KYCDocuments';

const ALLOWED_STATUSES = ['PRE_APPROVED', 'PENDING_DOCUMENTS', 'PENDING_SIGNATURE', 'APPROVED'];

export default function KYCDocumentosPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const documentsStatus = useSolicitudStore(s => s.documentsStatus);
  const documentUrls = useSolicitudStore(s => s.documentUrls);
  const documentsVerification = useSolicitudStore(s => s.documentsVerification);
  const application = useSolicitudStore(s => s.application);

  useEffect(() => {
    if (application && !ALLOWED_STATUSES.includes(application.status)) {
      router.replace(`/solicitudes/${id}`);
    }
  }, [application, id, router]);

  return (
    <div className="py-4">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <FunnelKYCDocuments
          applicationId={id}
          initialFrontUrl={documentUrls.dniFront}
          initialBackUrl={documentUrls.dniBack}
          loading={documentsStatus !== 'success'}
          verification={documentsVerification}
        />
      </div>
    </div>
  );
}
