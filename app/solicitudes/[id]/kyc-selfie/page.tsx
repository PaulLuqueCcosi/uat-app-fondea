'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { FunnelKYCSelfie } from '@/components/forms/solicitar/KYCSelfie';
import { listDocumentsAction, getDocumentUrlAction } from '@/app/actions/document.actions';
import { useSolicitudData } from '@/components/solicitudes/SolicitudContext';

export default function KYCSelfiePage() {
  const params = useParams();
  const id = params.id as string;
  const { documents, documentUrls, setDocuments, setDocumentUrl } = useSolicitudData();

  const [selfieUrl, setSelfieUrl] = useState<string | null>(documentUrls.selfie);
  const [loading, setLoading] = useState(!documents);

  useEffect(() => {
    // Si ya tenemos los datos en el contexto, usarlos
    if (documents) {
      // Aún así verificar si necesitamos la URL de selfie
      if (!selfieUrl) {
        const selfieDoc = documents.documents.find(d => d.type === 'SELFIE' && d.status === 'UPLOADED');
        if (selfieDoc) {
          getDocumentUrlAction(id, 'SELFIE').then((url) => {
            setSelfieUrl(url);
            setDocumentUrl('selfie', url);
          });
        }
      }
      setLoading(false);
      return;
    }

    // Si no, cargar y guardar en contexto
    async function load() {
      const docList = await listDocumentsAction(id);
      setDocuments(docList);

      if (docList) {
        const selfieDoc = docList.documents.find(d => d.type === 'SELFIE' && d.status === 'UPLOADED');
        if (selfieDoc) {
          const url = await getDocumentUrlAction(id, 'SELFIE');
          setSelfieUrl(url);
          setDocumentUrl('selfie', url);
        }
      }
      setLoading(false);
    }

    load();
  }, [id, documents, selfieUrl, setDocuments, setDocumentUrl]);

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
        <FunnelKYCSelfie
          applicationId={id}
          initialSelfieUrl={selfieUrl}
        />
      </div>
    </div>
  );
}
