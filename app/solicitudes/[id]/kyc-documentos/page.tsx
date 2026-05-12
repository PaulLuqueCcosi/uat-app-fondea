import { FunnelKYCDocuments } from '@/components/forms/solicitar/KYCDocuments';
import { listDocumentsAction, getDocumentUrlAction } from '@/app/actions/document.actions';
import type { DocumentType } from '@/app/actions/document.actions';

export default async function KYCDocumentosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Obtener documentos ya subidos
  const docList = await listDocumentsAction(id);

  // Obtener URLs de preview para los que ya están subidos
  let frontUrl: string | null = null;
  let backUrl: string | null = null;

  if (docList) {
    const frontDoc = docList.documents.find(d => d.type === 'DNI_FRONT' && d.status === 'UPLOADED');
    const backDoc = docList.documents.find(d => d.type === 'DNI_BACK' && d.status === 'UPLOADED');

    if (frontDoc) {
      frontUrl = await getDocumentUrlAction(id, 'DNI_FRONT');
    }
    if (backDoc) {
      backUrl = await getDocumentUrlAction(id, 'DNI_BACK');
    }
  }

  return (
    <div className='py-4'>
      <div className='mx-auto w-full px-4 sm:px-6 lg:px-8'>
        <FunnelKYCDocuments
          applicationId={id}
          initialFrontUrl={frontUrl}
          initialBackUrl={backUrl}
        />
      </div>
    </div>
  );
}
