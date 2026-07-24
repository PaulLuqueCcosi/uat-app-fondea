import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileCheck, Fingerprint, Globe, Monitor } from 'lucide-react';
import type { AdminApplicationContract } from '@/modules/admin/admin-application-detail.service';

interface Props {
  data: AdminApplicationContract;
}

const CONTRACT_STATUS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  GENERATED: { label: 'Generado', variant: 'secondary' },
  SIGNED: { label: 'Firmado', variant: 'default' },
  EXPIRED: { label: 'Expirado', variant: 'outline' },
};

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function ApplicationContractSection({ data }: Props) {
  const hasContract = data.contractId != null;
  const hasSignature = data.signature != null;

  if (!hasContract && !hasSignature) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <FileCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No hay contrato generado para esta solicitud</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estado del contrato */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileCheck className="h-4 w-4" /> Contrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {data.contractId && (
              <span className="font-mono text-xs text-muted-foreground">{data.contractId.slice(0, 8)}…</span>
            )}
            {data.contractStatus && (() => {
              const cfg = CONTRACT_STATUS[data.contractStatus] ?? { label: data.contractStatus, variant: 'outline' as const };
              return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Firma digital */}
      {hasSignature && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Fingerprint className="h-4 w-4" /> Firma digital
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem label="Nombre firmante" value={data.signature!.signedName} />
              <InfoItem label="Fecha de firma" value={formatDateTime(data.signature!.signatureTimestamp)} />
              <InfoItem label="IP" value={data.signature!.ipAddress ?? '—'} icon={Globe} />
              <InfoItem label="Dispositivo" value={
                data.signature!.userAgent
                  ? data.signature!.userAgent.length > 60
                    ? data.signature!.userAgent.slice(0, 60) + '…'
                    : data.signature!.userAgent
                  : '—'
              } icon={Monitor} />
            </div>

            {/* Declaración de aceptación */}
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[11px] text-muted-foreground mb-1">Declaración de aceptación</p>
              <p className="text-xs italic text-foreground">{data.signature!.acceptanceStatement}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoItem({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
