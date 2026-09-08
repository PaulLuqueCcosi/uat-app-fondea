import { Badge } from '@/components/ui/badge';
import { FileText, User } from 'lucide-react';
import Link from 'next/link';
import type {
  AdminApplicationCore,
  AdminApplicationContract,
  AdminApplicationEvaluation,
} from '@/modules/admin/admin-application-detail.service';
import { EVALUATION_STEP_LABELS } from '@/modules/admin/admin-application-detail.service';

interface Props {
  data: AdminApplicationCore;
  contract: AdminApplicationContract | null;
  evaluation: AdminApplicationEvaluation | null;
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

function buildFullName(client: AdminApplicationCore['client']) {
  if (!client) return null;
  return [client.firstName, client.secondName, client.paternalSurname, client.maternalSurname]
    .filter(Boolean)
    .join(' ');
}

/**
 * `core.contractStatus` es un campo fantasma: el backend (`AdminApplicationCoreResponse`)
 * nunca lo envía, así que siempre llegaba `undefined` y el KPI mostraba "Sin contrato" aunque
 * la solicitud tuviera contrato firmado. El estado real del contrato vive en la respuesta de
 * `/contract` (misma que usa la pestaña "Contrato"), así que lo derivamos de ahí.
 */
function summarizeContractStatus(contract: AdminApplicationContract | null): string {
  const documents = contract?.documents ?? [];
  if (documents.length === 0) return 'Sin contrato';
  if (documents.every((d) => d.contractStatus === 'SIGNED' || d.contractStatus === 'FINALIZED')) return 'Firmado';
  if (documents.some((d) => d.contractStatus === 'EXPIRED')) return 'Expirado';
  return 'Pendiente de firma';
}

/**
 * `submittedCreditScoreSnapshot` es el score PREVIO del cliente al momento de enviar la
 * solicitud (input del motor de reglas, `calculated.currentScore` en JsonLogic) — es `null`
 * a propósito para un cliente sin historial, así que mostraba "—" incluso en solicitudes ya
 * evaluadas y aprobadas. El score que de verdad importa acá es el RESULTADO del motor de
 * reglas para esta corrida (`finalScore` del snapshot de evaluación más reciente), que es
 * el que decide APPROVED/REJECTED — se prioriza ese y se cae al score previo solo si no hay
 * ninguna evaluación registrada.
 */
function summarizeScore(evaluation: AdminApplicationEvaluation | null, submittedCreditScoreSnapshot: number | null): string {
  const latest = evaluation?.evaluations?.[0];
  if (latest?.finalScore != null) {
    return `${latest.finalScore}/100`;
  }
  if (submittedCreditScoreSnapshot != null) return `${submittedCreditScoreSnapshot}`;
  return '—';
}

const CREDIT_CREATION_LABELS: Record<string, string> = {
  PENDING: 'Por crear',
  PROCESSING: 'Creando…',
  COMPLETED: 'Completado',
  FAILED: 'Falló',
};

/**
 * `EvaluationStep` solo modela el pipeline automático (validación → scoring → cálculo →
 * contrato) y termina, por diseño, en PRE_APPROVED — `LoanApplication.approve()` cambia
 * `status` a APPROVED pero nunca toca `evaluationStep`, porque ese pipeline ya terminó ahí.
 * Mostrar "Pre-aprobada" congelado al lado de "Estado: Aprobada" confunde (parece que el dato
 * no avanzó), así que una vez que el status ya dejó atrás la evaluación, el 4º KPI muestra el
 * siguiente tramo real que sigue en curso: la creación del crédito post-firma.
 */
function evaluationOrNextStepLabel(data: AdminApplicationCore): { label: string; value: string } {
  const pastEvaluation = data.status === 'APPROVED' || data.status === 'REJECTED_BY_USER' || data.status === 'BLOCKED';
  if (pastEvaluation && data.creditCreationStatus) {
    return { label: 'Creación de crédito', value: CREDIT_CREATION_LABELS[data.creditCreationStatus] ?? data.creditCreationStatus };
  }
  return {
    label: 'Paso evaluación',
    value: data.evaluationStep ? EVALUATION_STEP_LABELS[data.evaluationStep] ?? data.evaluationStep : '—',
  };
}

export function ApplicationDetailHeader({ data, contract, evaluation }: Props) {
  const statusConfig = STATUS_CONFIG[data.status] ?? { label: data.status, variant: 'outline' as const };
  const clientName = buildFullName(data.client);
  const contractLabel = summarizeContractStatus(contract);
  const scoreLabel = summarizeScore(evaluation, data.submittedCreditScoreSnapshot);
  const stepKpi = evaluationOrNextStepLabel(data);

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
        <KpiCard label="Score" value={scoreLabel} />
        <KpiCard label={stepKpi.label} value={stepKpi.value} />
        <KpiCard label="Contrato" value={contractLabel} />
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
