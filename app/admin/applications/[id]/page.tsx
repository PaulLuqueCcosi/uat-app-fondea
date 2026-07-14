import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  FileImage,
  FileText,
  Send,
  ShieldCheck,
  BarChart3,
  Star,
  AlertTriangle,
  Globe,
  User,
  Landmark,
  CreditCard,
  FileCheck,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getApplicationLifecycle, EVENT_LABELS, STATUS_LABELS, VERIFICATION_STATUS_LABELS } from '@/modules/admin/admin-lifecycle.service';
import type { ApplicationLifecycle, LoanDetail, CreditSummary, TimelineEvent } from '@/modules/admin/admin-lifecycle.service';
import { DocumentDetailDialog } from '@/components/admin/DocumentDetailDialog';
import { ApplicationLoanDetail } from '@/components/admin/applications/ApplicationLoanDetail';

// ── Icon helpers ────────────────────────────────────────────────────────────

const EVENT_ICONS: Record<string, React.ElementType> = {
  SUBMITTED: Send,
  VALIDATION_DISPATCHED: Clock,
  VALIDATION_COMPLETED: ShieldCheck,
  VALIDATION_FAILED: AlertTriangle,
  SCORING_DISPATCHED: Clock,
  SCORING_COMPLETED: BarChart3,
  SCORING_FAILED: AlertTriangle,
  PRE_APPROVED: Star,
  REJECTED: XCircle,
  FAILED: AlertTriangle,
};

function getEventIcon(event: string) {
  return EVENT_ICONS[event] ?? Clock;
}

// ── Stepper helpers ───────────────────────────────────────────────────────────

type StepState = 'completed' | 'active' | 'pending';

interface Step {
  key: string;
  label: string;
  icon: React.ElementType;
}

const STEPS: Step[] = [
  { key: 'intention', label: 'Intención', icon: Globe },
  { key: 'application', label: 'Solicitud', icon: FileText },
  { key: 'evaluation', label: 'Evaluación', icon: BarChart3 },
  { key: 'documents', label: 'Documentos', icon: FileCheck },
  { key: 'contract', label: 'Contrato', icon: FileText },
  { key: 'disbursement', label: 'Desembolso', icon: Landmark },
  { key: 'credit', label: 'Crédito', icon: CreditCard },
];

function getStepStates(lifecycle: ApplicationLifecycle): Record<string, StepState> {
  const states: Record<string, StepState> = {};

  // Intención: siempre completada (hay solicitud)
  states.intention = 'completed';

  // Solicitud: completada
  states.application = 'completed';

  // Evaluación: depende del estado
  const appStatus = lifecycle.application?.status;
  if (appStatus === 'SUBMITTED') states.evaluation = 'active';
  else if (['PROCESSING', 'PRE_APPROVED', 'APPROVED', 'REJECTED', 'FAILED', 'BLOCKED', 'EXPIRED'].includes(appStatus ?? '')) {
    states.evaluation = 'completed';
  } else {
    states.evaluation = 'pending';
  }

  // Documentos: si hay verificación
  const docOverall = lifecycle.documents?.verification?.overall;
  if (docOverall === 'VERIFIED') states.documents = 'completed';
  else if (['UPLOADED', 'PROCESSING', 'PENDING'].includes(docOverall ?? '')) states.documents = 'active';
  else if (docOverall === 'REJECTED' || docOverall === 'FAILED') states.documents = 'active';
  else states.documents = 'pending';

  // Contrato
  const contractStatus = lifecycle.application?.contract_status;
  if (contractStatus === 'SIGNED') states.contract = 'completed';
  else if (contractStatus === 'GENERATED') states.contract = 'active';
  else if (appStatus === 'APPROVED') states.contract = 'completed'; // aprobada implica contrato firmado
  else states.contract = 'pending';

  // Desembolso
  if (lifecycle.credit) {
    const disbStatus = lifecycle.credit.disbursement?.status;
    if (disbStatus === 'COMPLETED') states.disbursement = 'completed';
    else if (disbStatus === 'PENDING' || disbStatus === 'FAILED') states.disbursement = 'active';
    else states.disbursement = 'pending';
  } else {
    states.disbursement = 'pending';
  }

  // Crédito
  if (lifecycle.credit) {
    states.credit = lifecycle.credit.status === 'PAID_OFF' ? 'completed' : 'active';
  } else {
    states.credit = 'pending';
  }

  return states;
}

// ── LoanDetail adapter ────────────────────────────────────────────────────────

function adaptLoanDetail(loan: LoanDetail | null) {
  if (!loan) return null;
  return {
    principal: Number(loan.principal),
    totalToPay: Number(loan.total_to_pay),
    monthlyPayment: Number(loan.monthly_payment),
    installmentCount: loan.installment_count,
    termDays: loan.term_days,
    isFirstLoan: loan.is_first_loan,
    creditScoreUsed: 0, // no disponible en LoanDetail
    totalFeesOriginal: Number(loan.total_fees_original),
    totalDiscounts: Number(loan.total_discounts),
    totalIgv: Number(loan.total_igv),
    schedule: loan.schedule.map((s) => ({
      installmentNo: s.installment_no,
      dueDate: s.due_date,
      amount: Number(s.amount),
    })),
    fees: [], // no disponible en backend
    fixedDiscounts: [], // no disponible en backend
    totalFeesResult: Number(loan.total_fees_original) - Number(loan.total_discounts),
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lifecycle = await getApplicationLifecycle(id);

  if (!lifecycle) {
    notFound();
  }

  const app = lifecycle.application;
  const statusCfg = STATUS_LABELS[app?.status ?? 'SUBMITTED'] ?? { label: app?.status ?? 'Desconocido', color: 'secondary' };
  const stepStates = getStepStates(lifecycle);

  const tabs: { value: string; label: string }[] = [
    { value: 'solicitud', label: 'Solicitud' },
    { value: 'prestamo', label: 'Detalle del préstamo' },
  ];
  if (lifecycle.credit) {
    tabs.push({ value: 'credito', label: 'Crédito' });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Back */}
      <Link href="/admin/applications" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" /> Solicitudes
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold font-mono">{id}</h1>
          <Badge variant={statusCfg.color as any}>{statusCfg.label}</Badge>
          {lifecycle.origin?.anonymous && (
            <Badge variant="outline" className="text-[10px]">
              <Globe className="h-3 w-3 mr-1" /> Landing
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {lifecycle.user?.name ? (
            <Link href={`/admin/users/${lifecycle.user.id}`} className="font-medium hover:text-primary">
              {lifecycle.user.name}
            </Link>
          ) : (
            'Usuario desconocido'
          )}
          {' · '}
          {lifecycle.loanDetail && `S/ ${Number(lifecycle.loanDetail.principal).toLocaleString()} · ${lifecycle.loanDetail.term_days} días · ${lifecycle.loanDetail.installment_count} cuotas`}
          {app?.credit_score !== null && app?.credit_score !== undefined && ` · Score: ${app.credit_score}`}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Enviada: {app?.submitted_at ? new Date(app.submitted_at).toLocaleString('es-PE') : '—'}
          {app?.evaluated_at && ` · Evaluada: ${new Date(app.evaluated_at).toLocaleString('es-PE')}`}
        </p>
      </div>

      {/* Stepper */}
      <div className="rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {STEPS.map((step, i) => {
            const state = stepStates[step.key] ?? 'pending';
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-center shrink-0">
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium ${
                  state === 'completed' ? 'bg-success-100 text-success-700' :
                  state === 'active' ? 'bg-primary/10 text-primary' :
                  'text-muted-foreground'
                }`}>
                  <Icon className="h-3.5 w-3.5" />
                  <span>{step.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-4 h-px mx-1 ${
                    state === 'completed' ? 'bg-success-300' : 'bg-border'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rejection info */}
      {app?.rejection_reason && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">Motivo de rechazo</p>
          <p className="text-sm text-foreground mt-0.5">{app.rejection_reason}</p>
          {app.can_retry_at && (
            <p className="text-xs text-muted-foreground mt-1">
              Puede reintentar desde: {new Date(app.can_retry_at).toLocaleDateString('es-PE')}
            </p>
          )}
        </div>
      )}

      <Separator />

      {/* ═══ TABS ═══ */}
      <Tabs defaultValue="solicitud" className="w-full">
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>

        {/* Tab: Solicitud */}
        <TabsContent value="solicitud" className="space-y-6 mt-4">
          {/* ═══ ORIGEN ═══ */}
          {lifecycle.origin && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" /> Origen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lifecycle.origin.anonymous && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                    <p className="text-sm font-medium">Intención anónima (Landing)</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <span>Monto: S/ {Number(lifecycle.origin.anonymous.amount).toLocaleString()}</span>
                      <span>Plazo: {lifecycle.origin.anonymous.termDays} días</span>
                      <span>Cuotas: {lifecycle.origin.anonymous.installmentCount}</span>
                      <span>IP: {lifecycle.origin.anonymous.client_ip ?? '—'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Fecha: {new Date(lifecycle.origin.anonymous.created_at).toLocaleString('es-PE')}
                    </p>
                  </div>
                )}
                {lifecycle.origin.userIntention && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                    <p className="text-sm font-medium">Intención de usuario</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <span>Monto: S/ {Number(lifecycle.origin.userIntention.amount).toLocaleString()}</span>
                      <span>Plazo: {lifecycle.origin.userIntention.termDays} días</span>
                      <span>Cuotas: {lifecycle.origin.userIntention.installmentCount}</span>
                      <span>Tipo: {lifecycle.origin.userIntention.is_first_loan ? '1er préstamo' : 'Recurrente'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ═══ TIMELINE ═══ */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" /> Pipeline de Evaluación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={lifecycle.timeline} />
            </CardContent>
          </Card>

          {/* ═══ DOCUMENTS ═══ */}
          <DocumentsCard documents={lifecycle.documents} />

          {/* ═══ FORMS ═══ */}
          {lifecycle.forms && lifecycle.forms.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" /> Formularios del expediente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lifecycle.forms.map((form) => (
                    <div key={form.key} className="flex items-center justify-between py-1.5">
                      <span className="text-sm">{form.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{form.completed_at ?? '—'}</span>
                        {form.completed ? <CheckCircle2 className="h-4 w-4 text-success-600" /> : <Clock className="h-4 w-4 text-warning-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══ PEP ═══ */}
          {lifecycle.pep && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Declaraciones PEP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 text-sm">
                  <PepItem ok={lifecycle.pep.not_pep} label="No es persona políticamente expuesta" />
                  <PepItem ok={lifecycle.pep.not_pep_relative} label="No es familiar de persona políticamente expuesta" />
                  <PepItem ok={lifecycle.pep.accept_terms} label="Acepta términos y condiciones" />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Detalle del préstamo */}
        <TabsContent value="prestamo" className="mt-4">
          {lifecycle.loanDetail ? (
            <ApplicationLoanDetail loan={adaptLoanDetail(lifecycle.loanDetail)!} />
          ) : (
            <p className="text-sm text-muted-foreground">No hay detalle financiero disponible.</p>
          )}
        </TabsContent>

        {/* Tab: Crédito */}
        {lifecycle.credit && (
          <TabsContent value="credito" className="mt-4 space-y-6">
            <CreditTab credit={lifecycle.credit} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay eventos registrados.</p>;
  }

  return (
    <div className="relative pl-6">
      <div className="absolute left-[11px] top-1 bottom-1 w-px bg-border" />
      <div className="space-y-4">
        {events.map((event, i) => {
          const Icon = getEventIcon(event.event);
          const isLast = i === events.length - 1;
          const isError = event.event.includes('FAILED');
          return (
            <div key={event.id} className="relative flex gap-3">
              <div className={`absolute -left-6 w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 ${
                isError ? 'bg-destructive text-white' :
                isLast ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              }`}>
                <Icon className="h-3 w-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{EVENT_LABELS[event.event] ?? event.event}</span>
                  <Badge variant="outline" className="text-[9px] font-mono">{event.event}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(event.created_at).toLocaleString('es-PE')}
                </p>
                {event.detail && (
                  <pre className="mt-1.5 p-2 rounded bg-muted/50 text-[10px] font-mono text-muted-foreground overflow-x-auto">
                    {event.detail}
                  </pre>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DocumentsCard({ documents }: { documents: ApplicationLifecycle['documents'] }) {
  if (!documents) return null;

  const v = documents.verification;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileImage className="h-4 w-4 text-muted-foreground" /> Documentos
          {v && (
            <Badge variant={v.overall === 'VERIFIED' ? 'success' : v.overall === 'PENDING' ? 'warning' : 'destructive'} className="text-[10px]">
              {VERIFICATION_STATUS_LABELS[v.overall] ?? v.overall}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Verificación */}
        {v && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DocStatusCard title="DNI Frontal" status={v.dni_front} />
            <DocStatusCard title="DNI Reverso" status={v.dni_back} />
            <DocStatusCard title="Selfie" status={v.selfie} />
          </div>
        )}

        {/* Archivos subidos */}
        {documents.files.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {documents.files.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4 space-y-3">
                <div className="w-full h-24 bg-muted rounded flex items-center justify-center">
                  <FileImage className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{doc.file_name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={doc.status === 'VERIFIED' ? 'success' : doc.status === 'PENDING' ? 'warning' : 'destructive'} className="text-[10px]">
                      {VERIFICATION_STATUS_LABELS[doc.status] ?? doc.status}
                    </Badge>
                    {doc.storage_url && (
                      <DocumentDetailDialog doc={{
                        name: doc.file_name,
                        status: doc.status === 'VERIFIED' ? 'verified' : doc.status === 'PENDING' ? 'pending' : 'failed',
                        type: doc.type,
                        uploadedAt: doc.uploaded_at,
                        fileSize: formatFileSize(doc.file_size_bytes),
                      }} />
                    )}
                  </div>
                </div>
                {doc.rejection_reason && (
                  <p className="text-xs text-destructive">{doc.rejection_reason}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DocStatusCard({ title, status }: { title: string; status: { status: string; result: string | null; rejection_reason: string | null; attempts: number; failed_attempts: number } }) {
  const variant = status.status === 'VERIFIED' ? 'success' : status.status === 'PENDING' ? 'warning' : 'destructive';
  return (
    <div className="border rounded-lg p-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        <Badge variant={variant} className="text-[10px]">{VERIFICATION_STATUS_LABELS[status.status] ?? status.status}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">Intentos: {status.attempts} · Fallidos: {status.failed_attempts}</p>
      {status.rejection_reason && <p className="text-xs text-destructive">{status.rejection_reason}</p>}
    </div>
  );
}

function PepItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? <CheckCircle2 className="h-4 w-4 text-success-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
      <span>{label}</span>
    </div>
  );
}

function CreditTab({ credit }: { credit: CreditSummary }) {
  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">S/ {Number(credit.principal).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Monto original</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">S/ {Number(credit.total_paid).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total pagado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">S/ {Number(credit.total_outstanding).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Saldo pendiente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{credit.installments_completed}/{credit.installment_count}</p>
            <p className="text-xs text-muted-foreground">Cuotas pagadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Cronograma */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Cronograma de Cuotas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">#</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Vencimiento</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Monto</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Pagado</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Mora</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Pagado el</th>
                </tr>
              </thead>
              <tbody>
                {credit.installments.map((inst) => (
                  <tr key={inst.id} className="border-b">
                    <td className="px-4 py-2 font-mono">{inst.installment_no}</td>
                    <td className="px-4 py-2">{new Date(inst.due_date + 'T00:00:00').toLocaleDateString('es-PE')}</td>
                    <td className="px-4 py-2 text-right font-mono">S/ {Number(inst.amount_due).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right font-mono">S/ {Number(inst.amount_paid).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right font-mono">{inst.penalty_accrued > 0 ? `S/ ${Number(inst.penalty_accrued).toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-2">
                      <Badge variant={inst.status === 'PAID' ? 'success' : inst.status === 'OVERDUE' ? 'destructive' : inst.status === 'CURRENT' ? 'default' : 'secondary'} className="text-[10px]">
                        {inst.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {inst.paid_at ? new Date(inst.paid_at).toLocaleDateString('es-PE') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Transacciones */}
      {credit.transactions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Transacciones</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Monto</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Creado por</th>
                  </tr>
                </thead>
                <tbody>
                  {credit.transactions.map((tx) => (
                    <tr key={tx.id} className="border-b">
                      <td className="px-4 py-2">
                        <Badge variant={tx.type === 'DISBURSEMENT' ? 'default' : tx.type === 'REPAYMENT' ? 'success' : tx.type === 'REVERSAL' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {tx.type}
                        </Badge>
                        {tx.is_reversed && <span className="text-xs text-destructive ml-1">(Reversada)</span>}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">S/ {Number(tx.amount).toLocaleString()}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(tx.transaction_date + 'T00:00:00').toLocaleDateString('es-PE')}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{tx.created_by ?? 'system'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desembolso */}
      {credit.disbursement && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Desembolso</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Monto</span><span>S/ {Number(credit.disbursement.amount).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Método</span><span>{credit.disbursement.method ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Banco destino</span><span>{credit.disbursement.destination_bank ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cuenta destino</span><span>{credit.disbursement.destination_account ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Estado</span>
              <Badge variant={credit.disbursement.status === 'COMPLETED' ? 'success' : 'destructive'} className="text-[10px]">
                {credit.disbursement.status}
              </Badge>
            </div>
            {credit.disbursement.failure_reason && (
              <p className="text-xs text-destructive">{credit.disbursement.failure_reason}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historial de estados */}
      {credit.statusChanges.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Historial de estados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {credit.statusChanges.map((sc) => (
                <div key={sc.id} className="flex items-center justify-between py-1 text-sm">
                  <span>{sc.from_status ?? '—'} → {sc.to_status ?? '—'}</span>
                  <span className="text-xs text-muted-foreground">{new Date(sc.changed_at).toLocaleString('es-PE')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
