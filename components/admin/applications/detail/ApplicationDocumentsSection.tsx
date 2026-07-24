import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Camera, CheckCircle2, XCircle, Clock, AlertCircle, FileCheck } from 'lucide-react';
import type { AdminApplicationDocuments } from '@/modules/admin/admin-application-detail.service';

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

export function ApplicationDocumentsSection({ data }: Props) {
  const verification = data.verification;

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
              />
              <VerificationCard
                title="DNI Reverso"
                status={verification.dniBackStatus}
                rejectionReason={verification.dniBackRejectionReason}
                attempts={verification.dniBackAttempts}
                failedAttempts={verification.dniBackFailedAttempts}
              />
              <VerificationCard
                title="Selfie"
                status={verification.selfieStatus}
                rejectionReason={verification.selfieRejectionReason}
                attempts={verification.selfieAttempts}
                failedAttempts={verification.selfieFailedAttempts}
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
                          {doc.storageUrl && (
                            <a href={doc.storageUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              Ver
                            </a>
                          )}
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

function VerificationCard({ title, status, rejectionReason, attempts, failedAttempts }: {
  title: string;
  status: string | null;
  rejectionReason: string | null;
  attempts: number | null;
  failedAttempts: number | null;
}) {
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
    </div>
  );
}
