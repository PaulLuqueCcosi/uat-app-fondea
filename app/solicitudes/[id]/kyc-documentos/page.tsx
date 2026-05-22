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
  const documentUrls = useSolicitudStore(s => s.documentUrls);
  const documents = useSolicitudStore(s => s.documents);
  const application = useSolicitudStore(s => s.application);
  const fetchDocuments = useSolicitudStore(s => s.fetchDocuments);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  // Redirigir si el status no permite acceder a esta página
  useEffect(() => {
    if (application && !ALLOWED_STATUSES.includes(application.status)) {
      router.replace(`/solicitudes/${id}`);
    }
  }, [application, id, router]);

  if (!documents) return <DocumentosSkeleton />;

  return (
    <div className="py-4">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <FunnelKYCDocuments
          applicationId={id}
          initialFrontUrl={documentUrls.dniFront}
          initialBackUrl={documentUrls.dniBack}
        />
      </div>
    </div>
  );
}

function DocumentosSkeleton() {
  return (
    <div className="py-4">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-7 bg-neutral-100 rounded w-1/3" />
          <div className="h-4 bg-neutral-50 rounded w-2/3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="rounded-xl border border-neutral-100 p-6 space-y-4">
              <div className="h-5 bg-neutral-100 rounded w-1/2" />
              <div className="h-48 bg-neutral-50 rounded-lg" />
              <div className="h-10 bg-neutral-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
