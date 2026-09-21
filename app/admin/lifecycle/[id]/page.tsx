import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Ban,
  Calculator,
  User,
  FileText,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BackLink } from '@/components/admin/shared';
import { getUniversalLifecycle } from '@/modules/admin/admin-lifecycle.service';
import { creditStatusInfo } from '@/modules/admin/credit-status-labels';
import { DataRow } from '@/components/ui/data-row';

// ── Status configs ───────────────────────────────────────────────────────────

const APP_STATUS_LABELS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  SUBMITTED: { label: 'Enviada', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  PROCESSING: { label: 'Evaluando', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  PRE_APPROVED: { label: 'Pre-aprobada', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  APPROVED: { label: 'Aprobada', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  REJECTED: { label: 'Rechazada', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  REJECTED_BY_USER: { label: 'Rechazada (usr)', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  FAILED: { label: 'Fallida', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  BLOCKED: { label: 'Bloqueada', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  EXPIRED: { label: 'Expirada', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

// Los labels del crédito vienen de `modules/admin/credit-status-labels` — acá había un
// Record duplicado que pintaba OVERDUE en rojo mientras el resto del admin lo pinta ámbar.

// ── Sub-components ─────────────────────────────────────────────────────────

function EmptyStep({ message, sub }: { message: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Ban className="h-5 w-5 text-muted-foreground/50" />
      </div>
      <p className="text-sm text-muted-foreground font-medium">{message}</p>
      {sub && <p className="text-xs text-muted-foreground/70 mt-1 max-w-[200px]">{sub}</p>}
    </div>
  );
}

interface PipelineStepProps {
  number: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'rejected' | 'empty';
  children: React.ReactNode;
  href?: string;
}

function PipelineStep({ number, title, subtitle, icon: Icon, status, children, href }: PipelineStepProps) {
  const statusConfig = {
    completed: { circle: 'bg-emerald-500', shadow: 'shadow-emerald-100', border: 'border-emerald-200', bg: 'bg-card' },
    active: { circle: 'bg-amber-500', shadow: 'shadow-amber-100', border: 'border-amber-200', bg: 'bg-card' },
    rejected: { circle: 'bg-red-500', shadow: 'shadow-red-100', border: 'border-red-200', bg: 'bg-card' },
    empty: { circle: 'bg-muted', shadow: 'shadow-muted', border: 'border-border', bg: 'bg-muted/50' },
  }[status];

  return (
    <div className={`flex-1 rounded-xl border p-6 transition-all duration-300 ${statusConfig.bg} ${status === 'empty' ? 'border-dashed' : statusConfig.border} ${status !== 'empty' ? 'shadow-sm hover:shadow-md' : ''}`}>
      {/* Step header with icon */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white ${statusConfig.circle} ${status !== 'empty' ? 'shadow-lg shadow-opacity-20' : ''}`}>
          {status === 'completed' ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : status === 'rejected' ? (
            <AlertCircle className="h-6 w-6" />
          ) : status === 'active' ? (
            <Clock className="h-6 w-6" />
          ) : (
            <span className="text-lg font-bold">{number}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className={`text-base font-bold ${status === 'empty' ? 'text-muted-foreground' : 'text-foreground'}`}>
            {title}
          </p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {/* Divider */}
      <div className={`h-px mb-5 ${status === 'empty' ? 'bg-border' : 'bg-border'}`} />

      {/* Content */}
      <div className="min-h-[140px]">
        {children}
      </div>

      {/* Action */}
      {href && (
        <div className="mt-5 pt-4 border-t border-border">
          <Link href={href}>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-10 gap-2 text-xs font-medium bg-card hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver detalle
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function StepArrow({ active }: { active: boolean }) {
  return (
    <div className="hidden md:flex flex-col items-center justify-center px-4 py-8">
      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${active ? 'bg-emerald-100' : 'bg-gray-100'}`}>
        <ArrowRight className={`h-4 w-4 ${active ? 'text-emerald-600' : 'text-gray-300'}`} />
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default async function AdminLifecycleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lifecycle = await getUniversalLifecycle(id);

  if (!lifecycle) {
    notFound();
  }

  const origin = lifecycle.origin;
  const user = lifecycle.user;
  const app = lifecycle.application;
  const credit = lifecycle.credit;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 min-h-0">
      {/* Header */}
      <div>
        <BackLink href="/admin/intentions" label="Intenciones" />
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Flujo de intención</h1>
          <span className="text-sm text-muted-foreground font-mono">{id.slice(0, 8)}…</span>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Ciclo completo: calculadora → registro → solicitud → crédito
        </p>
      </div>

      {/* Pipeline */}
      <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-0">
        {/* Step 1: Landing Intention */}
        <PipelineStep
          number={1}
          title="Intención Landing"
          subtitle="Calculadora pública"
          icon={Calculator}
          status={origin?.anonymous ? 'completed' : 'empty'}
        >
          {origin?.anonymous ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <DataRow horizontal label="Monto" value={`S/ ${Number(origin.anonymous.amount).toLocaleString()}`} bold />
                <DataRow horizontal label="Plazo" value={`${origin.anonymous.termDays} días`} />
                <DataRow horizontal label="Cuotas" value={String(origin.anonymous.installmentCount)} />
                <DataRow horizontal label="IP" value={origin.anonymous.client_ip ?? '—'} />
              </div>
              <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                <p className="text-xs text-muted-foreground">
                  {new Date(origin.anonymous.created_at).toLocaleString('es-PE')}
                </p>
              </div>
            </div>
          ) : (
            <EmptyStep message="Sin intención" sub="El usuario no usó la calculadora pública" />
          )}
        </PipelineStep>

        <StepArrow active={!!origin?.anonymous} />

        {/* Step 2: User Intention */}
        <PipelineStep
          number={2}
          title="Intención Usuario"
          subtitle="Registrada en plataforma"
          icon={User}
          status={origin?.userIntention ? 'completed' : 'empty'}
        >
          {origin?.userIntention ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <DataRow horizontal label="Monto" value={`S/ ${Number(origin.userIntention.amount).toLocaleString()}`} bold />
                <DataRow horizontal label="Plazo" value={`${origin.userIntention.termDays} días`} />
                <DataRow horizontal label="Cuotas" value={String(origin.userIntention.installmentCount)} />
                <DataRow horizontal label="Tipo" value={origin.userIntention.is_first_loan ? '1er prést.' : 'Recurrente'} />
              </div>
              {user && (
                <div className="mt-3 pt-3 border-t border-dashed border-border">
                  <p className="text-xs text-muted-foreground mb-1">Vinculado a</p>
                  <p className="text-sm font-semibold text-foreground">{user.name ?? 'Sin nombre'}</p>
                  {user.document_number && (
                    <p className="text-xs text-muted-foreground font-mono">DNI {user.document_number}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <EmptyStep message="Sin registro" sub="Aún no se registra en el sistema" />
          )}
        </PipelineStep>

        <StepArrow active={!!origin?.userIntention} />

        {/* Step 3: Application */}
        <PipelineStep
          number={3}
          title="Solicitud"
          subtitle="Formal de préstamo"
          icon={FileText}
          status={
            app
              ? app.status === 'APPROVED' || app.status === 'PRE_APPROVED'
                ? 'completed'
                : app.status === 'REJECTED' || app.status === 'FAILED' || app.status === 'BLOCKED'
                  ? 'rejected'
                  : 'active'
              : 'empty'
          }
          href={app ? `/admin/applications/${lifecycle.applicationId}` : undefined}
        >
          {app ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${APP_STATUS_LABELS[app.status]?.bg ?? 'bg-gray-50'} ${APP_STATUS_LABELS[app.status]?.text ?? 'text-gray-700'} ${APP_STATUS_LABELS[app.status]?.border ?? 'border-gray-200'}`}>
                  {APP_STATUS_LABELS[app.status]?.label ?? app.status}
                </span>
              </div>
              {app.submitted_at && (
                <DataRow horizontal label="Enviada" value={new Date(app.submitted_at).toLocaleDateString('es-PE')} />
              )}
              {app.credit_score != null && (
                <DataRow horizontal label="Score" value={String(app.credit_score)} bold />
              )}
              {app.rejection_reason && (
                <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded-md">{app.rejection_reason}</p>
              )}
            </div>
          ) : (
            <EmptyStep message="Sin solicitud" sub="Aún no convierte en solicitud formal" />
          )}
        </PipelineStep>

        <StepArrow active={!!app} />

        {/* Step 4: Credit */}
        <PipelineStep
          number={4}
          title="Crédito"
          subtitle="Desembolsado"
          icon={CreditCard}
          // Rojo solo cuando hay problema real (mora o castigo). Antes cualquier estado
          // distinto de ACTIVE/PAID_OFF salía rojo, así que un crédito recién creado
          // (PENDING_DISBURSEMENT) se veía como si algo hubiera fallado.
          status={
            credit
              ? credit.status === 'PAID_OFF'
                ? 'completed'
                : credit.status === 'OVERDUE' || credit.status === 'WRITTEN_OFF'
                  ? 'rejected'
                  : 'active'
              : 'empty'
          }
          href={credit ? `/admin/credits/${credit.id}` : undefined}
        >
          {credit ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  title={creditStatusInfo(credit.status).description}
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${creditStatusInfo(credit.status).chipClass}`}
                >
                  {creditStatusInfo(credit.status).label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <DataRow horizontal label="Monto" value={`S/ ${Number(credit.principal).toLocaleString()}`} bold />
                <DataRow horizontal label="Pagado" value={`S/ ${Number(credit.total_paid).toLocaleString()}`} />
                <DataRow horizontal label="Cuotas" value={`${credit.installments_completed}/${credit.installment_count}`} />
                <DataRow horizontal label="Pendiente" value={`S/ ${Number(credit.total_outstanding).toLocaleString()}`} />
              </div>
            </div>
          ) : (
            <EmptyStep message="Sin crédito" sub="Aún no se desembolsa" />
          )}
        </PipelineStep>
      </div>

      {/* Progress summary */}
      <div className="rounded-xl bg-muted border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-foreground">Progreso del flujo</p>
          <p className="text-sm text-muted-foreground">
            {[origin?.anonymous, origin?.userIntention, app, credit].filter(Boolean).length} de 4 pasos
          </p>
        </div>
        <div className="flex gap-1.5">
          {[origin?.anonymous, origin?.userIntention, app, credit].map((exists, i) => (
            <div
              key={i}
              className={`flex-1 h-2.5 rounded-full transition-all duration-500 ${
                exists ? 'bg-emerald-400' : 'bg-muted-foreground/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Completado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>En proceso</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Rechazado / Mora</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted border border-border" />
          <span>No existe</span>
        </div>
      </div>
    </div>
  );
}
