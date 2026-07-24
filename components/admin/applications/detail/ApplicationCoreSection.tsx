import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText, User, Calendar, CheckCircle2, XCircle, Clock, AlertCircle,
  Shield, Hash,
} from 'lucide-react';
import Link from 'next/link';
import type { AdminApplicationCore } from '@/modules/admin/admin-application-detail.service';

interface Props {
  data: AdminApplicationCore;
}

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  SUBMITTED: { label: 'Enviada', variant: 'secondary' },
  PROCESSING: { label: 'Evaluando', variant: 'secondary' },
  PRE_APPROVED: { label: 'Pre-aprobada', variant: 'default' },
  APPROVED: { label: 'Aprobada', variant: 'default' },
  REJECTED: { label: 'Rechazada', variant: 'destructive' },
  REJECTED_BY_USER: { label: 'Rechazada (usuario)', variant: 'outline' },
  FAILED: { label: 'Fallida', variant: 'destructive' },
  BLOCKED: { label: 'Bloqueada', variant: 'destructive' },
  EXPIRED: { label: 'Expirada', variant: 'outline' },
};

const EVAL_STEP_LABELS: Record<string, string> = {
  VALIDATION_DISPATCHED: 'Validación enviada',
  VALIDATION_COMPLETED: 'Validación completada',
  VALIDATION_FAILED: 'Validación fallida',
  SCORING_DISPATCHED: 'Scoring enviado',
  SCORING_COMPLETED: 'Scoring completado',
  SCORING_FAILED: 'Scoring fallido',
  COMPLETED: 'Completado',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function buildFullName(client: AdminApplicationCore['client']) {
  if (!client) return '—';
  return [client.firstName, client.secondName, client.paternalSurname, client.maternalSurname]
    .filter(Boolean)
    .join(' ');
}

// ── Component ────────────────────────────────────────────────────────────────

export function ApplicationCoreSection({ data }: Props) {
  const statusConfig = STATUS_CONFIG[data.status] ?? { label: data.status, variant: 'outline' as const };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Detalle de Solicitud</h1>
            <p className="text-xs text-muted-foreground font-mono">#{data.id?.slice(0, 8) ?? '—'}</p>
          </div>
        </div>
        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Col 1-2: Información principal */}
        <div className="lg:col-span-2 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Estado" value={statusConfig.label} />
            <KpiCard label="Score" value={data.submittedCreditScoreSnapshot != null ? `${data.submittedCreditScoreSnapshot}` : '—'} />
            <KpiCard label="Paso evaluación" value={data.evaluationStep ? EVAL_STEP_LABELS[data.evaluationStep] ?? data.evaluationStep : '—'} />
            <KpiCard label="Contrato" value={data.contractStatus ?? 'Sin contrato'} />
          </div>

          {/* Fechas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Fechas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <InfoItem label="Enviada" value={formatDateTime(data.submittedAt)} />
                <InfoItem label="Evaluada" value={formatDateTime(data.evaluatedAt)} />
                <InfoItem label="Expira" value={formatDateTime(data.expiresAt)} />
                <InfoItem label="Creada" value={formatDateTime(data.createdAt)} />
                <InfoItem label="Actualizada" value={formatDateTime(data.updatedAt)} />
                {data.canRetryAt && (
                  <InfoItem label="Puede reintentar" value={formatDateTime(data.canRetryAt)} />
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

          {/* PEP */}
          {data.pepDeclarations && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Declaraciones PEP
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

          {/* Timeline de eventos */}
          {data.events && data.events.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Timeline del pipeline ({data.events.length} eventos)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {data.events.map((event, i) => (
                    <div key={event.id} className="flex gap-3 relative">
                      {i !== data.events.length - 1 && (
                        <div className="absolute left-[7px] top-6 bottom-0 w-px bg-gray-200" />
                      )}
                      <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </div>
                      <div className="pb-4 min-w-0">
                        <p className="text-xs font-medium">{event.event}</p>
                        {event.detail && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md" title={event.detail}>
                            {event.detail.length > 100 ? event.detail.slice(0, 100) + '…' : event.detail}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatDateTime(event.createdAt)}</p>
                      </div>
                    </div>
                  ))}
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
                  <User className="h-4 w-4" /> Cliente
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
                <Hash className="h-4 w-4" /> Referencias
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
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}

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
