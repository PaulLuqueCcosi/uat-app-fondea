import { notFound } from 'next/navigation';
import { ArrowLeft, CreditCard, History, Receipt, Calendar, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminCreditDetail } from '@/modules/admin/admin-credit-detail.service';
import type { CreditStatus, InstallmentStatus, CreditAuditEvent, InstallmentAuditEvent } from '@/modules/admin/admin-credit-detail.service';

// ── Status labels ────────────────────────────────────────────────────────────

const CREDIT_STATUS: Record<CreditStatus, { label: string; variant: string }> = {
  ACTIVE: { label: 'Activo', variant: 'success' },
  OVERDUE: { label: 'En mora', variant: 'warning' },
  DEFAULTED: { label: 'Default', variant: 'destructive' },
  PAID_OFF: { label: 'Liquidado', variant: 'secondary' },
};

const INSTALLMENT_STATUS: Record<InstallmentStatus, { label: string; bg: string; text: string }> = {
  PENDING: { label: 'Pendiente', bg: 'bg-gray-50', text: 'text-gray-600' },
  CURRENT: { label: 'Activa', bg: 'bg-blue-50', text: 'text-blue-700' },
  PARTIALLY_PAID: { label: 'Parcial', bg: 'bg-amber-50', text: 'text-amber-700' },
  PAID: { label: 'Pagada', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  OVERDUE: { label: 'Vencida', bg: 'bg-red-50', text: 'text-red-700' },
};

// ── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminCreditDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getAdminCreditDetail(id);

  if (!data) {
    notFound();
  }

  const { credit, installments, creditAudit, installmentAudit } = data;
  const progress = credit.total_due > 0
    ? Math.round((credit.total_paid / (credit.total_due + credit.total_penalty)) * 100)
    : 0;

  const statusCfg = CREDIT_STATUS[credit.status];

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-5xl">
      {/* Back */}
      <Link href="/admin/credits" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" /> Créditos
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Crédito</h1>
              <Badge variant={statusCfg.variant as any}>{statusCfg.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{id}</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold">S/ {credit.principal.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Capital</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold">S/ {credit.total_due.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Total a pagar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-emerald-600">S/ {credit.total_paid.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Pagado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-amber-600">S/ {credit.total_outstanding.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Pendiente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold">{progress}%</p>
            <p className="text-[10px] text-muted-foreground">Avance</p>
            <div className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Desembolso: {credit.disbursed_at ? new Date(credit.disbursed_at).toLocaleDateString('es-PE') : '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Vencimiento: {new Date(credit.maturity_date).toLocaleDateString('es-PE')}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Receipt className="h-3.5 w-3.5" />
          <span>Cuotas: {credit.installments_completed}/{credit.installment_count}</span>
        </div>
        {credit.total_penalty > 0 && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Mora: S/ {credit.total_penalty.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Installments table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Receipt className="h-4 w-4" /> Cronograma de Cuotas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">#</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Vencimiento</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Monto</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Pagado</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Mora</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Pendiente</th>
                  <th className="text-center px-4 py-2 font-medium text-muted-foreground text-xs">Estado</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Pagado el</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((inst) => {
                  const stCfg = INSTALLMENT_STATUS[inst.status];
                  return (
                    <tr key={inst.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-2 font-mono text-xs">{inst.installment_no}</td>
                      <td className="px-4 py-2 text-xs">{new Date(inst.due_date).toLocaleDateString('es-PE')}</td>
                      <td className="px-4 py-2 text-right font-mono text-xs">S/ {inst.amount_due.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-mono text-xs">S/ {inst.amount_paid.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-mono text-xs">
                        {inst.penalty_accrued > 0 ? `S/ ${inst.penalty_accrued.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-xs font-medium">
                        S/ {inst.outstanding.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${stCfg.bg} ${stCfg.text}`}>
                          {stCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {inst.paid_at ? new Date(inst.paid_at).toLocaleDateString('es-PE') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Audit timeline - Credit level */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4" /> Historial del Crédito
          </CardTitle>
        </CardHeader>
        <CardContent>
          {creditAudit.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin eventos registrados</p>
          ) : (
            <div className="space-y-3">
              {creditAudit.map((event) => (
                <div key={event.id} className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{event.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(event.createdAt).toLocaleString('es-PE')}
                      </span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{event.triggeredBy}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    {event.eventType}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit timeline - Installment level */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4" /> Historial de Cuotas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {installmentAudit.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin eventos registrados</p>
          ) : (
            <div className="space-y-3">
              {installmentAudit.map((event) => (
                <div key={event.id} className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{event.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(event.createdAt).toLocaleString('es-PE')}
                      </span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{event.triggeredBy}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-mono">
                      Cuota {event.installmentNo}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                      {event.eventType}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
