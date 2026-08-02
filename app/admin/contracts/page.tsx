import { FileText } from 'lucide-react';
import { getDocumentTypes } from '@/modules/admin/admin-contracts.service';
import { ContractsPageClient } from '@/components/admin/contracts/ContractsPageClient';

export default async function AdminContractsPage() {
  const documentTypes = await getDocumentTypes();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Contratos y Documentos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tipos de documentos contractuales y sus plantillas
          </p>
        </div>
      </div>

      <ContractsPageClient documentTypes={documentTypes} />
    </div>
  );
}
