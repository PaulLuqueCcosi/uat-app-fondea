import { FunnelKYCSelfie } from '@/components/forms/solicitar/KYCSelfie';
import { listDocumentsAction, getDocumentUrlAction } from '@/app/actions/document.actions';

export default async function KYCSelfiePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Obtener documentos ya subidos
  const docList = await listDocumentsAction(id);

  let selfieUrl: string | null = null;

  if (docList) {
    const selfieDoc = docList.documents.find(d => d.type === 'SELFIE' && d.status === 'UPLOADED');
    if (selfieDoc) {
      selfieUrl = await getDocumentUrlAction(id, 'SELFIE');
    }
  }

  return (
    <div className='py-4'>
      <div className='mx-auto w-full px-4 sm:px-6 lg:px-8'>
        <FunnelKYCSelfie
          applicationId={id}
          initialSelfieUrl={selfieUrl}
        />
      </div>
    </div>
  );
}
