import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar, CheckCircle2, XCircle, AlertCircle, Shield, Hash, User, FileText,
} from 'lucide-react';
import Link from 'next/link';
import type { AdminApplicationCore } from '@/modules/admin/admin-application-detail.service';
import { CreditCreationRetryButton } from './CreditCreationRetryButton';

interface Props {
  data: AdminApplicationCore;
  /** Fechas ya formateadas en el server component (page.tsx) — evita hydration
   *  mismatch por diferencias de ICU Node vs navegador con toLocaleString. */
  dates: {
    submittedAt: string;
    evaluatedAt: string;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
    canRetryAt: string;
  };
}

const CREDIT_CREATION_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pendiente', variant: 'secondary' },
  PROCESSING: { label: 'Procesando', variant: 'secondary' },
  COMPLETED: { label: 'Completado', variant: 'default' },
  FAILED: { label: 'Falló', variant: 'destructive' },
};

function buildFullName(client: AdminApplicationCore['client']) {
  if (!client) return '—';
  return [client.firstName, client.secondName, client.paternalSurname, client.maternalSurname]
    .filter(Boolean)
    .join(' ');
}

export function ApplicationOverviewTab({ data, dates }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Col 1-2: Información principal */}
      <div className="lg:col-span-2 space-y-4">
        {/* Fechas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" /> Fechas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <InfoItem label="Enviada" value={dates.submittedAt} />
              <InfoItem label="Evaluada" value={dates.evaluatedAt} />
              <InfoItem label="Expira" value={dates.expiresAt} />
              <InfoItem label="Creada" value={dates.createdAt} />
              <InfoItem label="Actualizada" value={dates.updatedAt} />
              {data.canRetryAt && (
                <InfoItem label="Puede reintentar" value={dates.canRetryAt} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error / Rechazo */}
        {(data.rejectionReason || data.evaluationError || data.failureCode) && (
          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" /> Motivo de fallo / rechazo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.rejectionReason && (
                <div>
                  <p className="text-[11px] text-muted-foreground">Razón de rechazo</p>
                  <p className="text-sm text-red-700">{data.rejectionReason}</p>
                </div>
              )}
              {data.failureCode && (
                <div>
                  <p className="text-[11px] text-muted-foreground">Código de fallo</p>
                  <p className="text-sm font-mono">{data.failureCode}</p>
                </div>
              )}
              {data.evaluationError && (
                <div>
                  <p className="text-[11px] text-muted-foreground">Error de evaluación</p>
                  <p className="text-sm text-red-600">{data.evaluationError}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Fase 2: Creación de crédito (post-firma) */}
        {data.creditCreationStatus && (
          <Card className={data.creditCreationStatus === 'FAILED' ? 'border-red-200' : undefined}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Creación de crédito (Fase 2)
                </span>
                <Badge variant={CREDIT_CREATION_CONFIG[data.creditCreationStatus]?.variant ?? 'outline'}>
                  {CREDIT_CREATION_CONFIG[data.creditCreationStatus]?.label ?? data.creditCreationStatus}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.creditId && (
                <InfoItem label="Crédito" value={
                  <Link href={`/admin/credits/${data.creditId}`} className="font-mono text-xs text-primary hover:underline">
                    {data.creditId.slice(0, 8)}…
                  </Link>
                } />
              )}
              {data.creditCreationStatus === 'FAILED' && (
                <>
                  {data.creditCreationError && (
                    <div>
                      <p className="text-[11px] text-muted-foreground">Error</p>
                      <p className="text-sm text-red-600">{data.creditCreationError}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    El reintento automático corre cada 15 min, pero podés forzarlo ahora.
                  </p>
                  <CreditCreationRetryButton applicationId={data.id} />
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* PEP */}
        {data.pepDeclarations && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" /> Declaraciones PEP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <PepItem label="No es PEP" value={data.pepDeclarations.notPep} />
                <PepItem label="Sin pariente PEP" value={data.pepDeclarations.notPepRelative} />
                <PepItem label="Aceptó términos" value={data.pepDeclarations.acceptTerms} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Col 3: Sidebar */}
      <div className="space-y-4">
        {/* Cliente */}
        {data.client && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" /> Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-sm">{buildFullName(data.client)}</p>
              {data.client.documentNumber && (
                <p className="text-xs text-muted-foreground font-mono mt-1">DNI {data.client.documentNumber}</p>
              )}
              <div className="mt-3">
                <Link href={`/admin/users/${data.userId}`}>
                  <Badge variant="outline" className="cursor-pointer text-xs">Ver perfil</Badge>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* IDs de referencia */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" /> Referencias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoItem label="User ID" value={<span className="font-mono text-xs">{data.userId?.slice(0, 8) ?? '—'}…</span>} />
            {data.userIntentionId && (
              <InfoItem label="Intención" value={
                <Link href={`/admin/intentions/${data.userIntentionId}`} className="font-mono text-xs text-primary hover:underline">
                  {data.userIntentionId.slice(0, 8)}…
                </Link>
              } />
            )}
            {data.contractId && (
              <InfoItem label="Contrato" value={<span className="font-mono text-xs">{data.contractId.slice(0, 8)}…</span>} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function PepItem({ label, value }: { label: string; value: boolean | null }) {
  const yes = value === true;
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${yes ? 'bg-emerald-100' : 'bg-red-100'}`}>
        {yes ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-red-600" />}
      </div>
      <span className="text-sm">{label}</span>
    </div>
  );
}
