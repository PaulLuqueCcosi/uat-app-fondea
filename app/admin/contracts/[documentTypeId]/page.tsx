import { FileCode2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getDocumentTypeById, getTemplateVersions, getContractVariables } from '@/modules/admin/admin-contracts.service';
import { Badge } from '@/components/ui/badge';
import { DetailPageHeader } from '@/components/admin/shared';
import { TemplateEditorClient } from '@/components/admin/contracts/TemplateEditorClient';

interface Props {
  params: Promise<{ documentTypeId: string }>;
}

export default async function DocumentTypeDetailPage({ params }: Props) {
  const { documentTypeId } = await params;

  const documentType = await getDocumentTypeById(documentTypeId);
  if (!documentType) return notFound();

  // Obtener la versión activa (la más reciente activa, o la primera si no hay activa)
  const [templates, variables] = await Promise.all([
    getTemplateVersions(documentTypeId),
    getContractVariables(documentTypeId),
  ]);
  const activeTemplate = templates.find((t) => t.active) ?? templates[0] ?? null;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <DetailPageHeader
        icon={<FileCode2 className="h-5 w-5 text-primary" />}
        title={documentType.name}
        subtitle={
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                {documentType.code}
              </span>
              {documentType.requiresSignature && (
                <Badge variant="outline" className="text-[10px]">Requiere firma</Badge>
              )}
              {documentType.visibleBeforeSignature && (
                <Badge variant="warning" className="text-[10px]">Visible pre-firma</Badge>
              )}
              {activeTemplate && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  v{activeTemplate.version}
                </span>
              )}
            </div>
            {documentType.description && (
              <p className="text-sm text-muted-foreground">{documentType.description}</p>
            )}
          </div>
        }
        badge={documentType.active ? { label: 'Activo', variant: 'success' } : { label: 'Inactivo', variant: 'secondary' }}
        backHref="/admin/contracts"
        backLabel="Contratos"
      />

      {/* Editor del template actual */}
      <TemplateEditorClient
        documentTypeId={documentType.id}
        documentTypeCode={documentType.code}
        templateCode={activeTemplate?.code ?? documentType.code.toLowerCase().replace(/_/g, '-')}
        documentTypeName={documentType.name}
        initialHtml={activeTemplate?.htmlContent ?? ''}
        initialCss={activeTemplate?.cssContent ?? ''}
        currentVersion={activeTemplate?.version ?? 0}
        variables={variables}
      />
    </div>
  );
}
