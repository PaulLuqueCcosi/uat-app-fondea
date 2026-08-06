'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Camera, CheckCircle2, XCircle, Clock, AlertCircle, FileCheck, ChevronDown, ChevronRight, Bot, Loader2, ExternalLink,
} from 'lucide-react';
import type { AdminApplicationDocuments, AttemptInfo, DocumentItem } from '@/modules/admin/admin-application-detail.service';

interface Props {
  data: AdminApplicationDocuments;
}

const VERIFICATION_STATUS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  PENDING: { label: 'Pendiente', variant: 'outline', icon: Clock },
  UPLOADED: { label: 'Subido', variant: 'secondary', icon: FileCheck },
  PROCESSING: { label: 'Procesando', variant: 'secondary', icon: Clock },
  VERIFIED: { label: 'Verificado', variant: 'default', icon: CheckCircle2 },
  REJECTED: { label: 'Rechazado', variant: 'destructive', icon: XCircle },
  FAILED: { label: 'Fallido', variant: 'destructive', icon: AlertCircle },
};

const ATTEMPT_RESULT_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  VERIFIED: { label: 'Verificado', variant: 'default' },
  REJECTED: { label: 'Rechazado', variant: 'destructive' },
  ERROR: { label: 'Error', variant: 'destructive' },
};

const DOC_TYPE_LABELS: Record<string, string> = {
  DNI_FRONT: 'DNI Frente',
  DNI_BACK: 'DNI Reverso',
  SELFIE: 'Selfie',
};

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(ms: number | null) {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function parseIssues(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
  } catch {
    return [raw];
  }
}

export function ApplicationDocumentsSection({ data }: Props) {
  const verification = data.verification;
  const attemptsByType = (type: string) => data.attempts.filter((a) => a.documentType === type);

  return (
    <div className="space-y-4">
      {/* Verificación general */}
      {verification && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Camera className="h-4 w-4" /> Proceso de verificación
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Overall badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-muted-foreground">Estado general:</span>
              {(() => {
                const cfg = VERIFICATION_STATUS[verification.overallStatus ?? 'PENDING'];
                return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
              })()}
            </div>

            {/* Per-document status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <VerificationCard
                title="DNI Frente"
                status={verification.dniFrontStatus}
                rejectionReason={verification.dniFrontRejectionReason}
                attempts={verification.dniFrontAttempts}
                failedAttempts={verification.dniFrontFailedAttempts}
                attemptLog={attemptsByType('DNI_FRONT')}
              />
              <VerificationCard
                title="DNI Reverso"
                status={verification.dniBackStatus}
                rejectionReason={verification.dniBackRejectionReason}
                attempts={verification.dniBackAttempts}
                failedAttempts={verification.dniBackFailedAttempts}
                attemptLog={attemptsByType('DNI_BACK')}
              />
              <VerificationCard
                title="Selfie"
                status={verification.selfieStatus}
                rejectionReason={verification.selfieRejectionReason}
                attempts={verification.selfieAttempts}
                failedAttempts={verification.selfieFailedAttempts}
                attemptLog={attemptsByType('SELFIE')}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Archivos subidos */}
      {data.documents.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileCheck className="h-4 w-4" /> Archivos subidos ({data.documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Archivo</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Tamaño</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">Estado</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Subido</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.documents.map((doc) => {
                    const statusCfg = VERIFICATION_STATUS[doc.status ?? 'PENDING'];
                    return (
                      <tr key={doc.id} className="border-b last:border-0">
                        <td className="py-2 font-medium">{DOC_TYPE_LABELS[doc.documentType ?? ''] ?? doc.documentType}</td>
                        <td className="py-2 max-w-[200px] truncate" title={doc.fileName}>{doc.fileName}</td>
                        <td className="py-2 font-mono">{formatBytes(doc.fileSizeBytes)}</td>
                        <td className="py-2 text-center">
                          <Badge variant={statusCfg?.variant ?? 'outline'} className="text-[10px]">
                            {statusCfg?.label ?? doc.status}
                          </Badge>
                        </td>
                        <td className="py-2">{formatDateTime(doc.uploadedAt)}</td>
                        <td className="py-2">
                          <ViewDocumentButton applicationId={data.applicationId} doc={doc} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sin datos */}
      {!verification && data.documents.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No hay documentos ni verificaciones para esta solicitud</p>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function VerificationCard({ title, status, rejectionReason, attempts, failedAttempts, attemptLog }: {
  title: string;
  status: string | null;
  rejectionReason: string | null;
  attempts: number | null;
  failedAttempts: number | null;
  attemptLog: AttemptInfo[];
}) {
  const [showAttempts, setShowAttempts] = useState(false);
  const cfg = VERIFICATION_STATUS[status ?? 'PENDING'];
  const Icon = cfg.icon;

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{title}</span>
        <span className={`inline-flex items-center gap-1 text-xs`}>
          <Icon className="h-3.5 w-3.5" />
          <Badge variant={cfg.variant} className="text-[10px]">{cfg.label}</Badge>
        </span>
      </div>
      {rejectionReason && (
        <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{rejectionReason}</p>
      )}
      {(attempts != null || failedAttempts != null) && (
        <p className="text-xs text-muted-foreground">
          Intentos: {attempts ?? 0}{failedAttempts ? ` (${failedAttempts} fallidos)` : ''}
        </p>
      )}

      {attemptLog.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowAttempts((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
          >
            <Bot className="h-3 w-3" />
            Ver historial de intentos ({attemptLog.length})
            {showAttempts ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>

          {showAttempts && (
            <div className="mt-2 space-y-2">
              {attemptLog.map((a) => (
                <AttemptRow key={a.id} attempt={a} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AttemptRow({ attempt }: { attempt: AttemptInfo }) {
  const resultCfg = ATTEMPT_RESULT_CONFIG[attempt.result ?? ''] ?? { label: attempt.result ?? '—', variant: 'outline' as const };
  const issues = parseIssues(attempt.issues);

  return (
    <div className="rounded-md bg-muted/40 p-2 space-y-1.5 text-[11px]">
      <div className="flex items-center justify-between flex-wrap gap-1">
        <span className="flex items-center gap-1.5">
          <span className="font-medium">Intento #{attempt.attemptNumber ?? '—'}</span>
          <Badge variant={resultCfg.variant} className="text-[9px]">{resultCfg.label}</Badge>
          {attempt.invocationError && <Badge variant="destructive" className="text-[9px]">Error de invocación</Badge>}
        </span>
        <span className="text-muted-foreground">{formatDateTime(attempt.createdAt)}</span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
        {attempt.confidence != null && <span>Confianza IA: <strong className="text-foreground">{attempt.confidence}%</strong></span>}
        <span>Duración: <strong className="text-foreground">{formatDuration(attempt.processingTimeMs)}</strong></span>
        {attempt.aiModel && <span>Modelo: <strong className="text-foreground font-mono">{attempt.aiModel}</strong></span>}
      </div>

      {(attempt.userMessage || attempt.message) && (
        <p className="text-foreground">{attempt.userMessage ?? attempt.message}</p>
      )}

      {issues.length > 0 && (
        <ul className="list-disc list-inside text-red-600">
          {issues.map((issue, i) => <li key={i}>{issue}</li>)}
        </ul>
      )}
    </div>
  );
}

/**
 * El storageUrl crudo del documento es una URI s3:// (no abre en el navegador) — este
 * botón pide una URL https:// pre-firmada bajo demanda en vez de linkear directo.
 */
function ViewDocumentButton({ applicationId, doc }: { applicationId: string; doc: DocumentItem }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      // fetch a una API route normal, NO una Server Action — invocar una Server
      // Action desde acá dispara un re-render del árbol de Server Components de
      // la página que choca con este mismo setState y tira
      // "insertBefore ... not a child of this node".
      const res = await fetch(`/api/admin/applications/${applicationId}/documents/${doc.id}/url`);
      if (res.ok) {
        const { url } = await res.json();
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('No se pudo obtener el documento');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
      Ver documento
    </button>
  );
}
