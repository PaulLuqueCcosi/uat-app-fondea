'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { FunnelKYCDocuments } from '@/components/forms/solicitar/KYCDocuments';
import { listDocumentsAction, getDocumentUrlAction } from '@/app/actions/document.actions';
import { useSolicitudData } from '@/components/solicitudes/SolicitudContext';

export default function KYCDocumentosPage() {
  const params = useParams();
  const id = params.id as string;
  const { documents, documentUrls, setDocuments, setDocumentUrl } = useSolicitudData();

  const [frontUrl, setFrontUrl] = useState<string | null>(documentUrls.dniFront);
  const [backUrl, setBackUrl] = useState<string | null>(documentUrls.dniBack);
  const [loading, setLoading] = useState(!documents);

  useEffect(() => {
    // Si ya tenemos los datos en el contexto, usarlos
    if (documents) {
      setLoading(false);
      return;
    }

    // Si no, cargar y guardar en contexto
    async function load() {
      const docList = await listDocumentsAction(id);
      setDocuments(docList);

      if (docList) {
        const frontDoc = docList.documents.find(d => d.type === 'DNI_FRONT' && d.status === 'UPLOADED');
        const backDoc = docList.documents.find(d => d.type === 'DNI_BACK' && d.status === 'UPLOADED');

        if (frontDoc) {
          const url = await getDocumentUrlAction(id, 'DNI_FRONT');
          setFrontUrl(url);
          setDocumentUrl('dniFront', url);
        }
        if (backDoc) {
          const url = await getDocumentUrlAction(id, 'DNI_BACK');
          setBackUrl(url);
          setDocumentUrl('dniBack', url);
        }
      }
      setLoading(false);
    }

    load();
  }, [id, documents, setDocuments, setDocumentUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <FunnelKYCDocuments
          applicationId={id}
          initialFrontUrl={frontUrl}
          initialBackUrl={backUrl}
        />
      </div>
    </div>
  );
}
