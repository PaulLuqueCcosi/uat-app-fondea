import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileImage, ExternalLink, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import type { AdminCreditFullDetail } from '@/modules/admin/admin-credit-detail.service';

interface CreditDocumentsPanelProps {
  data: AdminCreditFullDetail;
}

const DOC_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  UPLOADED: 'Subido',
  PROCESSING: 'Procesando',
  VERIFIED: 'Verificado',
  REJECTED: 'Rechazado',
  FAILED: 'Fallido',
};

export function CreditDocumentsPanel({ data }: CreditDocumentsPanelProps) {
  const docs = data.documents;
  if (!docs) return null;

  const verification = docs.verification;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileImage className="h-4 w-4" /> Documentos de verificación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {verification && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <DocStatusItem label="General" status={verification.overall} />
            <DocStatusItem label="DNI frontal" status={verification.dni_front?.status} />
            <DocStatusItem label="DNI reverso" status={verification.dni_back?.status} />
            <DocStatusItem label="Selfie" status={verification.selfie?.status} />
          </div>
        )}

        {docs.files.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Archivos</p>
            <div className="space-y-2">
              {docs.files.map((file) => (
                <div key={file.id} className="flex items-center justify-between rounded-lg border p-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileImage className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{file.file_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {file.type} · {(file.file_size_bytes / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={file.status === 'VERIFIED' ? 'success' : file.status === 'REJECTED' ? 'destructive' : 'outline'} className="text-[10px]">
                      {DOC_STATUS_LABELS[file.status] ?? file.status}
                    </Badge>
                    {file.storage_url && (
                      <Link href={file.storage_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DocStatusItem({ label, status }: { label: string; status?: string | null }) {
  if (!status) return null;
  const isOk = status === 'VERIFIED';
  const isRejected = status === 'REJECTED' || status === 'FAILED';
  return (
    <div className="rounded-lg border p-2.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1 mt-0.5">
        {isOk ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : isRejected ? <AlertCircle className="h-3.5 w-3.5 text-red-600" /> : <Shield className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className={`text-xs font-medium ${isOk ? 'text-emerald-600' : isRejected ? 'text-red-600' : ''}`}>
          {DOC_STATUS_LABELS[status] ?? status}
        </span>
      </div>
    </div>
  );
}
