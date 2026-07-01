import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
  Ban,
} from 'lucide-react';
import Link from 'next/link';
import { mockApplications } from '@/modules/admin';

// ── Types ─────────────────────────────────────────────────────────────────────

type ApplicationEventType =
  | 'SUBMITTED'
  | 'VALIDATION_DISPATCHED'
  | 'VALIDATION_COMPLETED'
  | 'VALIDATION_FAILED'
  | 'SCORING_DISPATCHED'
  | 'SCORING_COMPLETED'
  | 'SCORING_FAILED'
  | 'PRE_APPROVED'
  | 'REJECTED'
  | 'FAILED';

interface ApplicationEvent {
  id: string;
  event: ApplicationEventType;
  createdAt: string;
  detail: Record<string, any> | null;
}

type DocumentStatus = 'verified' | 'pending' | 'failed' | 'not_uploaded';

// ── Mock ──────────────────────────────────────────────────────────────────────

const EVENT_LABELS: Record<ApplicationEventType, string> = {
  SUBMITTED: 'Solicitud recibida',
  VALIDATION_DISPATCHED: 'Validación enviada',
  VALIDATION_COMPLETED: 'Validación completada',
  VALIDATION_FAILED: 'Validación fallida',
  SCORING_DISPATCHED: 'Scoring enviado',
  SCORING_COMPLETED: 'Score calculado',
  SCORING_FAILED: 'Scoring fallido',
  PRE_APPROVED: 'Pre-aprobada',
  REJECTED: 'Rechazada',
  FAILED: 'Error técnico',
};

const EVENT_ICONS: Record<ApplicationEventType, any> = {
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

function getMockDetail(id: string) {
  const app = mockApplications.find((a) => a.id === id);

  return {
    id,
    userName: app?.userName ?? 'Usuario desconocido',
    userId: app?.userId ?? 'usr_000',
    status: app?.status ?? 'PROCESSING',
    amount: app?.amount ?? 3000,
    termDays: 30,
    installments: 3,
    score: app?.score ?? 0,
    submittedAt: app?.submittedAt ?? '2026-05-29T22:39:59Z',
    evaluatedAt: '2026-05-29T22:41:17Z',
    rejectionReason: app?.status === 'REJECTED' ? 'Score insuficiente para el monto solicitado' : null,
    failureCode: null,
    canRetryAt: app?.status === 'REJECTED' ? '2026-06-22T15:30:00Z' : null,
    evaluationStep: 'SCORING_COMPLETED',
    pepDeclarations: { notPep: true, notPepRelative: true, acceptTerms: true },
    events: [
      { id: 'evt_001', event: 'SUBMITTED' as ApplicationEventType, createdAt: '2026-05-29T22:39:59Z', detail: null },
      { id: 'evt_002', event: 'VALIDATION_DISPATCHED' as ApplicationEventType, createdAt: '2026-05-29T22:40:01Z', detail: null },
      { id: 'evt_003', event: 'VALIDATION_COMPLETED' as ApplicationEventType, createdAt: '2026-05-29T22:40:45Z', detail: { passed: true, requiresManualReview: false, detail: 'Score: 5' } },
      { id: 'evt_004', event: 'SCORING_COMPLETED' as ApplicationEventType, createdAt: '2026-05-29T22:41:02Z', detail: { score: 622, calculatedAt: '2026-05-29T22:41:02Z' } },
      { id: 'evt_005', event: 'PRE_APPROVED' as ApplicationEventType, createdAt: '2026-05-29T22:41:17Z', detail: null },
    ],
    documents: [
      { name: 'DNI Frontal', status: 'verified' as DocumentStatus },
      { name: 'DNI Reverso', status: 'pending' as DocumentStatus },
      { name: 'Selfie', status: 'pending' as DocumentStatus },
    ],
    forms: [
      { name: 'KYC (Identidad)', completed: true, date: '2026-05-28' },
      { name: 'Laboral', completed: true, date: '2026-05-28' },
      { name: 'Económico', completed: true, date: '2026-05-29' },
      { name: 'Referencias', completed: true, date: '2026-05-29' },
      { name: 'Dirección', completed: true, date: '2026-05-29' },
      { name: 'Cuenta Bancaria', completed: true, date: '2026-05-29' },
    ],
  };
}

const STATUS_BADGE: Record<string, { label: string; variant: string }> = {
  SUBMITTED: { label: 'Enviada', variant: 'secondary' },
  PROCESSING: { label: 'Evaluando', variant: 'default' },
  PRE_APPROVED: { label: 'Pre-aprobada', variant: 'warning' },
  APPROVED: { label: 'Aprobada', variant: 'success' },
  REJECTED: { label: 'Rechazada', variant: 'error' },
  REJECTED_BY_USER: { label: 'Rechazada (usuario)', variant: 'secondary' },
  BLOCKED: { label: 'Bloqueada', variant: 'error' },
  FAILED: { label: 'Fallida', variant: 'error' },
  EXPIRED: { label: 'Expirada', variant: 'secondary' },
};

const DOC_BADGE: Record<DocumentStatus, { label: string; variant: string }> = {
  verified: { label: 'Verificado', variant: 'success' },
  pending: { label: 'Pendiente', variant: 'warning' },
  failed: { label: 'Rechazado', variant: 'error' },
  not_uploaded: { label: 'No subido', variant: 'secondary' },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = getMockDetail(id);
  const statusCfg = STATUS_BADGE[app.status] ?? { label: app.status, variant: 'secondary' };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Back */}
      <Link href="/admin/applications" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" /> Solicitudes
      </Link>

      {/* Header + Action */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-mono">{app.id}</h1>
            <Badge variant={statusCfg.variant as any}>{statusCfg.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            <Link href={`/admin/users/${app.userId}`} className="font-medium hover:text-primary">{app.userName}</Link>
            {' · '}S/ {app.amount.toLocaleString()} · {app.termDays} días · {app.installments} cuotas
            {app.score > 0 && ` · Score: ${app.score}`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enviada: {new Date(app.submittedAt).toLocaleString('es-PE')}
            {app.evaluatedAt && ` · Evaluada: ${new Date(app.evaluatedAt).toLocaleString('es-PE')}`}
          </p>
        </div>

        {/* Acción principal */}
        <Button variant="outline" size="sm" className="text-destructive border-destructive/30">
          <Ban className="h-3.5 w-3.5 mr-1.5" /> Rechazar solicitud
        </Button>
      </div>

      {/* Rejection info */}
      {app.rejectionReason && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">Motivo de rechazo</p>
          <p className="text-sm text-foreground mt-0.5">{app.rejectionReason}</p>
          {app.canRetryAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Puede reintentar desde: {new Date(app.canRetryAt).toLocaleDateString('es-PE')}
            </p>
          )}
        </div>
      )}

      <Separator />

      {/* ═══ TIMELINE ═══ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" /> Pipeline de Evaluación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pl-6">
            <div className="absolute left-[11px] top-1 bottom-1 w-px bg-border" />
            <div className="space-y-4">
              {app.events.map((event, i) => {
                const Icon = EVENT_ICONS[event.event] ?? Clock;
                const isLast = i === app.events.length - 1;
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
                        <span className="text-sm font-medium">{EVENT_LABELS[event.event]}</span>
                        <Badge variant="outline" className="text-[9px] font-mono">{event.event}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(event.createdAt).toLocaleString('es-PE')}
                      </p>
                      {event.detail && (
                        <pre className="mt-1.5 p-2 rounded bg-muted/50 text-[10px] font-mono text-muted-foreground overflow-x-auto">
                          {JSON.stringify(event.detail, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ DOCUMENTS ═══ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileImage className="h-4 w-4 text-muted-foreground" /> Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {app.documents.map((doc) => {
              const docCfg = DOC_BADGE[doc.status];
              return (
                <div key={doc.name} className="border rounded-lg p-4 space-y-3">
                  <div className="w-full h-24 bg-muted rounded flex items-center justify-center">
                    <FileImage className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{doc.name}</span>
                    <Badge variant={docCfg.variant as any} className="text-[10px]">{docCfg.label}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-7">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Aprobar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-7 text-destructive border-destructive/30">
                      <XCircle className="h-3 w-3 mr-1" /> Rechazar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ═══ FORMS ═══ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" /> Formularios del expediente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {app.forms.map((form) => (
              <div key={form.name} className="flex items-center justify-between py-1.5">
                <span className="text-sm">{form.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{form.date}</span>
                  {form.completed ? <CheckCircle2 className="h-4 w-4 text-success-600" /> : <Clock className="h-4 w-4 text-warning-500" />}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ═══ PEP Declarations ═══ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Declaraciones PEP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success-600" />
              <span>No es persona políticamente expuesta</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success-600" />
              <span>No es familiar de persona políticamente expuesta</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success-600" />
              <span>Acepta términos y condiciones</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
