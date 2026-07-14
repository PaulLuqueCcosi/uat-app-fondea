'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  FileText,
  User,
  CreditCard,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Shield,
  FileCheck,
  Camera,
  Fingerprint,
  Hash,
  Link as LinkIcon,
  Ban,
} from 'lucide-react';
import Link from 'next/link';
import type { ApplicationLifecycle } from '@/modules/admin/admin-lifecycle.service';

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

const EVAL_STEP_LABELS: Record<string, string> = {
  VALIDATION: 'Validación',
  SCORING: 'Scoring',
  CONTRACT_GENERATION: 'Contrato',
  COMPLETED: 'Completado',
};

const VERIFICATION_STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pendiente', color: 'text-gray-500', icon: Clock },
  UPLOADED: { label: 'Subido', color: 'text-blue-500', icon: FileCheck },
  PROCESSING: { label: 'Procesando', color: 'text-amber-500', icon: Clock },
  VERIFIED: { label: 'Verificado', color: 'text-emerald-500', icon: CheckCircle2 },
  REJECTED: { label: 'Rechazado', color: 'text-red-500', icon: XCircle },
  FAILED: { label: 'Fallido', color: 'text-red-500', icon: AlertCircle },
};

// ── Sub-components ─────────────────────────────────────────────────────────

function InfoItem({ label, value, icon: Icon, highlight = false }: {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 py-2">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm ${highlight ? 'font-semibold text-foreground' : 'text-foreground'}`}>{value}</p>
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, className = '' }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border bg-white p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Ban className="h-8 w-8 text-gray-300 mb-2" />
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

interface ApplicationDetailClientProps {
  data: ApplicationLifecycle;
}

export function ApplicationDetailClient({ data }: ApplicationDetailClientProps) {
  const app = data.application;
  const user = data.user;
  const loan = data.loanDetail;
  const docs = data.documents;
  const timeline = data.timeline;
  const pep = data.pep;

  const statusCfg = app ? APP_STATUS_LABELS[app.status] ?? { label: app.status, bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' } : null;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <Link href="/admin/applications" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Solicitudes
        </Link>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">Detalle de solicitud</h1>
          {data.applicationId && (
            <span className="text-sm text-muted-foreground font-mono">{data.applicationId.slice(0, 8)}…</span>
          )}
          {statusCfg && (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
              {statusCfg.label}
            </span>
          )}
        </div>
      </div>

      {/* Top grid: Usuario + Solicitud core */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Usuario */}
        <SectionCard title="Solicitante" icon={User}>
          {user ? (
            <div className="space-y-1">
              <InfoItem label="Nombre" value={user.name ?? '—'} icon={User} highlight />
              <InfoItem label="Documento" value={user.document_number ?? '—'} icon={Hash} />
              <div className="pt-2">
                <Link href={`/admin/users/${user.id}`}>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    <LinkIcon className="h-3.5 w-3.5" /> Ver perfil completo
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState message="No hay información del usuario" />
          )}
        </SectionCard>

        {/* Solicitud core */}
        <SectionCard title="Información general" icon={FileText}>
          {app ? (
            <div className="space-y-1">
              <InfoItem label="Estado" value={statusCfg?.label ?? app.status} icon={FileText} />
              {app.submitted_at && (
                <InfoItem label="Enviada" value={new Date(app.submitted_at).toLocaleString('es-PE')} icon={Calendar} />
              )}
              {app.evaluated_at && (
                <InfoItem label="Evaluada" value={new Date(app.evaluated_at).toLocaleString('es-PE')} icon={CheckCircle2} />
              )}
              {app.expires_at && (
                <InfoItem label="Expira" value={new Date(app.expires_at).toLocaleString('es-PE')} icon={Clock} />
              )}
              {app.credit_score != null && (
                <InfoItem label="Score" value={`${app.credit_score} / 1000`} icon={Hash} highlight />
              )}
              {app.evaluation_step && (
                <InfoItem label="Paso evaluación" value={EVAL_STEP_LABELS[app.evaluation_step] ?? app.evaluation_step} icon={Fingerprint} />
              )}
              {app.evaluation_error && (
                <InfoItem label="Error" value={app.evaluation_error} icon={AlertCircle} />
              )}
              {app.rejection_reason && (
                <InfoItem label="Razón de rechazo" value={app.rejection_reason} icon={XCircle} />
              )}
              {app.can_retry_at && (
                <InfoItem label="Puede reintentar desde" value={new Date(app.can_retry_at).toLocaleString('es-PE')} icon={Clock} />
              )}
              {app.failure_code && (
                <InfoItem label="Código de fallo" value={app.failure_code} icon={AlertCircle} />
              )}
            </div>
          ) : (
            <EmptyState message="No hay información de la solicitud" />
          )}
        </SectionCard>
      </div>

      {/* Contrato */}
      {app?.contract_id && (
        <SectionCard title="Contrato" icon={FileCheck} className="max-w-xl">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm">{app.contract_id.slice(0, 8)}…</span>
            <Badge variant="outline" className="text-xs">{app.contract_status ?? '—'}</Badge>
          </div>
        </SectionCard>
      )}

      {/* Detalle financiero */}
      <SectionCard title="Detalle financiero" icon={CreditCard}>
        {loan ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-muted-foreground">Producto</p>
                <p className="text-sm font-semibold">{loan.product_name ?? '—'}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-muted-foreground">Monto solicitado</p>
                <p className="text-sm font-semibold">S/ {Number(loan.requested_amount).toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-muted-foreground">Monto aprobado</p>
                <p className="text-sm font-semibold">S/ {Number(loan.approved_amount).toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-muted-foreground">Principal</p>
                <p className="text-sm font-semibold">S/ {Number(loan.principal).toLocaleString()}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoItem label="Plazo" value={`${loan.term_days} días`} />
              <InfoItem label="Cuotas" value={`${loan.installment_count}`} />
              <InfoItem label="1er préstamo" value={loan.is_first_loan ? 'Sí' : 'No'} />
              <InfoItem label="Score usado" value={loan.credit_score_used ?? '—'} />
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoItem label="Fees originales" value={`S/ ${Number(loan.total_fees_original).toLocaleString()}`} />
              <InfoItem label="Descuentos" value={`S/ ${Number(loan.total_discounts).toLocaleString()}`} />
              <InfoItem label="IGV" value={`S/ ${Number(loan.total_igv).toLocaleString()}`} />
              <InfoItem label="Total a pagar" value={`S/ ${Number(loan.total_to_pay).toLocaleString()}`} highlight />
            </div>

            {loan.was_limit_adjusted && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs text-amber-700 font-medium">Monto ajustado por límite de score</p>
                <p className="text-xs text-amber-600">Límite: S/ {Number(loan.score_limit_amount).toLocaleString()}</p>
                {loan.limit_note && <p className="text-xs text-amber-600">{loan.limit_note}</p>}
              </div>
            )}

            {/* Cronograma */}
            {loan.schedule && loan.schedule.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Cronograma de pagos</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">#</th>
                          <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Vencimiento</th>
                          <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loan.schedule.map((s) => (
                          <tr key={s.installment_no} className="border-b border-gray-50">
                            <td className="py-2 px-2 text-xs">{s.installment_no}</td>
                            <td className="py-2 px-2 text-xs">{new Date(s.due_date).toLocaleDateString('es-PE')}</td>
                            <td className="py-2 px-2 text-xs text-right font-mono">S/ {Number(s.amount).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <EmptyState message="No hay detalle financiero" />
        )}
      </SectionCard>

      {/* Documentos */}
      <SectionCard title="Documentos y verificaciones" icon={Camera}>
        {!docs?.verification ? (
          <EmptyState message="No hay información de documentos" />
        ) : (
          <div className="space-y-4">
            {/* Overall */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Verificación general:</span>
              {(() => {
                const v = docs.verification!;
                const cfg = VERIFICATION_STATUS_LABELS[v.overall];
                const Icon = cfg?.icon ?? Clock;
                return (
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg?.color ?? 'text-gray-500'}`}>
                    <Icon className="h-3.5 w-3.5" /> {cfg?.label ?? v.overall}
                  </span>
                );
              })()}
            </div>

            <Separator />

            {/* Individual docs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['dni_front', 'dni_back', 'selfie'] as const).map((key) => {
                const doc = docs.verification![key];
                const cfg = doc ? VERIFICATION_STATUS_LABELS[doc.status] : null;
                const Icon = cfg?.icon ?? Clock;
                const titles: Record<string, string> = { dni_front: 'DNI Frente', dni_back: 'DNI Reverso', selfie: 'Selfie' };
                return (
                  <div key={key} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{titles[key]}</span>
                      <span className={`inline-flex items-center gap-1 text-xs ${cfg?.color ?? 'text-gray-500'}`}>
                        <Icon className="h-3.5 w-3.5" /> {cfg?.label ?? doc?.status ?? 'Pendiente'}
                      </span>
                    </div>
                    {doc?.rejection_reason && (
                      <p className="text-xs text-red-500">{doc.rejection_reason}</p>
                    )}
                    {doc?.attempts != null && (
                      <p className="text-xs text-muted-foreground">Intentos: {doc.attempts}{doc.failed_attempts ? ` (${doc.failed_attempts} fallidos)` : ''}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Archivos */}
            {docs.files && docs.files.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Archivos subidos</p>
                  <div className="space-y-2">
                    {docs.files.map((f) => (
                      <div key={f.id} className="flex items-center justify-between rounded-lg border p-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{f.file_name}</p>
                            <p className="text-[10px] text-muted-foreground">{f.type} — {f.status}</p>
                          </div>
                        </div>
                        {f.storage_url && (
                          <a href={f.storage_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline shrink-0 ml-2">
                            Ver
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </SectionCard>

      {/* Timeline */}
      {timeline && timeline.length > 0 && (
        <SectionCard title="Timeline de evaluación" icon={Clock}>
          <div className="space-y-0">
            {timeline.map((event, i) => (
              <div key={event.id} className="flex gap-3 relative">
                {i !== timeline.length - 1 && (
                  <div className="absolute left-[7px] top-6 bottom-0 w-px bg-gray-200" />
                )}
                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                <div className="pb-4 min-w-0">
                  <p className="text-xs font-medium">{event.event}</p>
                  {event.detail && <p className="text-xs text-muted-foreground mt-0.5">{event.detail}</p>}
                  <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(event.created_at).toLocaleString('es-PE')}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* PEP */}
      {pep && (
        <SectionCard title="Declaraciones PEP" icon={Shield}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${pep.not_pep ? 'bg-emerald-100' : 'bg-red-100'}`}>
                {pep.not_pep ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-red-600" />}
              </div>
              <span className="text-sm">No es PEP</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${pep.not_pep_relative ? 'bg-emerald-100' : 'bg-red-100'}`}>
                {pep.not_pep_relative ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-red-600" />}
              </div>
              <span className="text-sm">No tiene pariente PEP</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${pep.accept_terms ? 'bg-emerald-100' : 'bg-red-100'}`}>
                {pep.accept_terms ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-red-600" />}
              </div>
              <span className="text-sm">Aceptó términos</span>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
