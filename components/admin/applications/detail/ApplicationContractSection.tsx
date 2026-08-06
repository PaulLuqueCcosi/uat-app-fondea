'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileCheck, Fingerprint, Globe, Monitor, RefreshCw, Loader2, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import type { AdminApplicationContract, AdminContractDocument } from '@/modules/admin/admin-application-detail.service';
import { ConfirmAction } from '@/components/admin/shared/ConfirmAction';
import { regenerateContractsAction } from '@/app/actions/admin-application.actions';

interface Props {
  data: AdminApplicationContract;
}

const CONTRACT_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  GENERATED: { label: 'Generado', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  SIGNED: { label: 'Firmado', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  FINALIZED: { label: 'Finalizado', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  EXPIRED: { label: 'Expirado', bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
};

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function ApplicationContractSection({ data }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  const documents = data.documents ?? [];
  const allSigned = documents.length > 0 && documents.every(d => d.contractStatus === 'SIGNED' || d.contractStatus === 'FINALIZED');
  const canRegenerate = documents.length === 0 || documents.some(d => d.contractStatus === 'GENERATED' || d.contractStatus === 'EXPIRED');

  const handleRegenerate = async () => {
    const result = await regenerateContractsAction(data.applicationId);
    if (result.ok) {
      toast.success('Contratos regenerados exitosamente');
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? 'No se pudieron regenerar los contratos');
    }
  };

  if (documents.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-dashed p-8 text-center">
          <FileCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No hay documentos contractuales generados</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() => setConfirmRegenerate(true)}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Generar contratos
        </Button>

        <ConfirmAction
          open={confirmRegenerate}
          onOpenChange={setConfirmRegenerate}
          title="¿Generar contratos?"
          description="Se generarán los documentos contractuales para esta solicitud usando los templates activos actuales."
          confirmLabel="Generar"
          onConfirm={handleRegenerate}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {canRegenerate && !allSigned && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-2"
            onClick={() => setConfirmRegenerate(true)}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Regenerar contratos
          </Button>
          <span className="text-[10px] text-muted-foreground">
            Solo si aún no fueron firmados
          </span>
        </div>
      )}

      {/* Lista de documentos */}
      {documents.map((doc) => (
        <DocumentCard key={doc.contractId} doc={doc} applicationId={data.applicationId} />
      ))}

      <ConfirmAction
        open={confirmRegenerate}
        onOpenChange={setConfirmRegenerate}
        title="¿Regenerar contratos?"
        description="Se eliminarán los contratos no firmados y se generarán nuevos con los templates activos actuales. Los documentos ya firmados no se verán afectados."
        confirmLabel="Regenerar"
        onConfirm={handleRegenerate}
      />
    </div>
  );
}

// ── Card individual por documento ─────────────────────────────────────────────

function DocumentCard({ doc, applicationId }: { doc: AdminContractDocument; applicationId: string }) {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const cfg = CONTRACT_STATUS_CONFIG[doc.contractStatus] ?? { label: doc.contractStatus, bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  const canViewPdf = doc.contractStatus === 'SIGNED' || doc.contractStatus === 'FINALIZED';

  const handleViewPdf = async () => {
    setLoadingPdf(true);
    try {
      // fetch a una API route normal, NO una Server Action — invocar una Server
      // Action desde acá dispara un re-render del árbol de Server Components de
      // la página que choca con este mismo setState y tira
      // "insertBefore ... not a child of this node".
      const res = await fetch(`/api/admin/applications/${applicationId}/contract/${doc.contractId}/pdf`);
      if (res.ok) {
        const { pdfUrl } = await res.json();
        window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('El PDF todavía no está disponible (¿el documento ya fue firmado?)');
      }
    } finally {
      setLoadingPdf(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            {doc.documentTypeName}
          </span>
          <span className="flex items-center gap-2">
            {canViewPdf && (
              <Button size="sm" variant="outline" className="h-6 gap-1 text-[10px] px-2" onClick={handleViewPdf} disabled={loadingPdf}>
                {loadingPdf ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                Ver PDF
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
              {cfg.label}
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">ID</p>
            <p className="font-mono">{doc.contractId.slice(0, 8)}…</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tipo</p>
            <p className="font-mono">{doc.documentTypeCode}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Generado</p>
            <p>{formatDateTime(doc.generatedAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Firmado</p>
            <p>{formatDateTime(doc.signedAt)}</p>
          </div>
        </div>

        {/* Flags */}
        <div className="flex gap-2">
          {doc.visibleBeforeSignature && (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[9px]">Visible pre-firma</Badge>
          )}
        </div>

        {/* Firma digital */}
        {doc.signature && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <p className="text-[11px] font-medium flex items-center gap-1.5">
              <Fingerprint className="h-3.5 w-3.5" /> Firma digital
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Firmante</p>
                <p className="font-medium">{doc.signature.signedName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fecha</p>
                <p>{formatDateTime(doc.signature.signatureTimestamp)}</p>
              </div>
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <p className="text-muted-foreground">{doc.signature.ipAddress ?? '—'}</p>
              </div>
              <div className="flex items-center gap-1">
                <Monitor className="h-3 w-3 text-muted-foreground" />
                <p className="text-muted-foreground truncate max-w-48">{doc.signature.userAgent ?? '—'}</p>
              </div>
            </div>
            {doc.signature.acceptanceStatement && (
              <p className="text-[10px] italic text-muted-foreground mt-1">{doc.signature.acceptanceStatement}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
