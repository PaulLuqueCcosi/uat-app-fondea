import { Badge } from '@/components/ui/badge';
import { FileText, User } from 'lucide-react';
import Link from 'next/link';
import type { AdminApplicationCore } from '@/modules/admin/admin-application-detail.service';

interface Props {
  data: AdminApplicationCore;
}

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

function buildFullName(client: AdminApplicationCore['client']) {
  if (!client) return null;
  return [client.firstName, client.secondName, client.paternalSurname, client.maternalSurname]
    .filter(Boolean)
    .join(' ');
}

export function ApplicationDetailHeader({ data }: Props) {
  const statusConfig = STATUS_CONFIG[data.status] ?? { label: data.status, variant: 'outline' as const };
  const clientName = buildFullName(data.client);

  return (
    <div className="space-y-4">
      {/* Título + estado */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground truncate">Detalle de Solicitud</h1>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="font-mono">#{data.id.slice(0, 8)}</span>
              {clientName && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {clientName}
                    {data.client?.documentNumber && (
                      <span className="font-mono">({data.client.documentNumber})</span>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        {data.client && (
          <Link href={`/admin/users/${data.userId}`}>
            <Badge variant="outline" className="cursor-pointer text-xs shrink-0">Ver perfil</Badge>
          </Link>
        )}
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Estado" value={statusConfig.label} />
        <KpiCard label="Score" value={data.submittedCreditScoreSnapshot != null ? `${data.submittedCreditScoreSnapshot}` : '—'} />
        <KpiCard label="Paso evaluación" value={data.evaluationStep ? EVAL_STEP_LABELS[data.evaluationStep] ?? data.evaluationStep : '—'} />
        <KpiCard label="Contrato" value={data.contractStatus ?? 'Sin contrato'} />
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3 bg-card">
      <p className="text-[11px] text-muted-foreground leading-none">{label}</p>
      <p className="text-lg font-bold mt-1 leading-tight text-foreground">{value}</p>
    </div>
  );
}
