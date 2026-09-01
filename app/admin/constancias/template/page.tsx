import Link from 'next/link';
import { ArrowLeft, FileCode2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CertificateTemplateEditorClient } from '@/components/admin/constancias/CertificateTemplateEditorClient';
import {
  getCertificateTemplateVersionsAction,
  getCertificateVariablesAction,
} from '@/app/actions/constancias.actions';

export default async function CertificateTemplatePage() {
  const [versions, variables] = await Promise.all([
    getCertificateTemplateVersionsAction(),
    getCertificateVariablesAction(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-start gap-3">
        <Link href="/admin/constancias">
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
              <h1 className="text-xl font-bold text-foreground">Plantilla — Constancia de No Adeudo</h1>
              <p className="text-sm text-muted-foreground">
                El documento que se genera al liquidar un crédito. Editar crea una nueva versión;
                el historial anterior nunca se pierde.
              </p>
            </div>
          </div>
        </div>
      </div>

      <CertificateTemplateEditorClient versions={versions} variables={variables} />
    </div>
  );
}
