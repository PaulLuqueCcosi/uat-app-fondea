import { ArrowLeft, FileCode2 } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDocumentTypeById, getTemplateVersions, getContractVariables } from '@/modules/admin/admin-contracts.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
      {/* Back + Header */}
      <div className="flex items-start gap-3">
        <Link href="/admin/contracts">
          <Button variant="ghost" size="icon" className="h-8 w-8 mt-0.5">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileCode2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{documentType.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                  {documentType.code}
                </span>
                {documentType.active ? (
                  <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">Activo</Badge>
                ) : (
                  <Badge className="bg-gray-50 text-gray-500 border-gray-200 text-[10px]">Inactivo</Badge>
                )}
                {documentType.requiresSignature && (
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">Requiere firma</Badge>
                )}
                {documentType.visibleBeforeSignature && (
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Visible pre-firma</Badge>
                )}
                {activeTemplate && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    v{activeTemplate.version}
                  </span>
                )}
              </div>
            </div>
          </div>
          {documentType.description && (
            <p className="text-sm text-muted-foreground mt-2 ml-13">
              {documentType.description}
            </p>
          )}
        </div>
      </div>

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
