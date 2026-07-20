import { notFound } from 'next/navigation';
import { ArrowLeft, CreditCard, History, Receipt, Calendar, AlertTriangle, Clock, User, MapPin, Award, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminCreditDetail } from '@/modules/admin/admin-credit-detail.service';
import { getDepartments, getProvinces, getDistricts } from 'ubigeo-fns';
import type { CreditStatus, InstallmentStatus, InstallmentItem } from '@/modules/admin/admin-credit-detail.service';

// ── Status labels ────────────────────────────────────────────────────────────

const CREDIT_STATUS: Record<CreditStatus, { label: string; variant: string }> = {
  ACTIVE: { label: 'Activo', variant: 'success' },
  OVERDUE: { label: 'En mora', variant: 'warning' },
  DEFAULTED: { label: 'Default', variant: 'destructive' },
  PAID_OFF: { label: 'Liquidado', variant: 'secondary' },
};

const INSTALLMENT_STATUS: Record<InstallmentStatus, { label: string; bg: string; text: string; border: string }> = {
  PENDING: { label: 'Pendiente', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
  CURRENT: { label: 'Activa', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  PARTIALLY_PAID: { label: 'Parcial', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  PAID: { label: 'Pagada', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  OVERDUE: { label: 'Vencida', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
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

  const { credit, installments, creditAudit, installmentAudit, portfolioDetail } = data;
  const progress = credit.total_due > 0
    ? Math.round((credit.total_paid / (credit.total_due + credit.total_penalty)) * 100)
    : 0;

  const statusCfg = CREDIT_STATUS[credit.status];
  const client = portfolioDetail?.client;
  const timeline = portfolioDetail?.timeline ?? [];

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
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

      {/* Datos del cliente */}
      {client && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{client.full_name ?? 'Sin nombre'}</span>
                {client.document_number && (
                  <span className="text-xs font-mono text-muted-foreground">DNI {client.document_number}</span>
                )}
              </div>
              {(client.ubigeo_region || client.ubigeo_district) && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {(() => {
                      const parts: string[] = [];
                      try {
                        if (client.ubigeo_district) {
                          const provCode = client.ubigeo_district.substring(0, 4);
                          const dists = getDistricts(provCode);
                          const distName = dists.find(d => d.code === client.ubigeo_district)?.name;
                          if (distName) parts.push(distName);
                        }
                        if (client.ubigeo_province) {
                          const regCode = client.ubigeo_province.substring(0, 2);
                          const provs = getProvinces(regCode);
                          const provName = provs.find(p => p.code === client.ubigeo_province)?.name;
                          if (provName) parts.push(provName);
                        }
                        if (client.ubigeo_region) {
                          const deps = getDepartments();
                          const depName = deps.find(d => d.code === client.ubigeo_region)?.name;
                          if (depName) parts.push(depName);
                        }
                      } catch { /* fallback */ }
                      return parts.length > 0 ? parts.join(', ') : (client.ubigeo_district ?? '—');
                    })()}
                  </span>
                </div>
              )}
              {client.fondea_score != null && (
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs">Score: <span className="font-mono font-medium">{client.fondea_score}</span></span>
                </div>
              )}
              {client.passport_points != null && (
                <div className="flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs">Pasaporte: <span className="font-mono font-medium">{client.passport_points} pts</span></span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary cards - full width */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
            <p className="text-lg font-bold text-red-600">S/ {credit.total_penalty.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Mora total</p>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Desembolso: {credit.disbursed_at ? new Date(credit.disbursed_at).toLocaleDateString('es-PE') : '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>1ra cuota: {new Date(credit.first_due_date).toLocaleDateString('es-PE')}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Vencimiento: {new Date(credit.maturity_date).toLocaleDateString('es-PE')}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Receipt className="h-3.5 w-3.5" />
          <span>Cuotas: {credit.installments_completed}/{credit.installment_count}</span>
        </div>
        {credit.overdue_since && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>En mora desde: {new Date(credit.overdue_since).toLocaleDateString('es-PE')}</span>
          </div>
        )}
      </div>

      {/* Installments - full width cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
          <Receipt className="h-4 w-4" /> Cronograma de Cuotas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {installments.map((inst) => (
            <InstallmentCard key={inst.id} installment={inst} creditId={id} />
          ))}
        </div>
      </div>

      {/* Timeline del crédito */}
      {timeline.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" /> Timeline del Crédito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
              {timeline.map((event, idx) => (
                <div key={idx} className="relative flex gap-3">
                  <div className="absolute -left-4 top-1 w-3 h-3 rounded-full border-2 border-primary bg-background" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">{event.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(event.timestamp).toLocaleString('es-PE')}
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-muted text-[9px] font-mono">{event.type}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit - 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credit audit */}
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
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {creditAudit.map((event) => (
                  <div key={event.id} className="flex gap-3 items-start">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{event.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(event.createdAt).toLocaleString('es-PE')}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">{event.triggeredBy}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Installment audit */}
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
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {installmentAudit.map((event) => (
                  <div key={event.id} className="flex gap-3 items-start">
                    <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{event.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(event.createdAt).toLocaleString('es-PE')}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-mono">
                          Cuota {event.installmentNo}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Installment Card ─────────────────────────────────────────────────────────

function InstallmentCard({ installment: inst, creditId }: { installment: InstallmentItem; creditId: string }) {
  const stCfg = INSTALLMENT_STATUS[inst.status];
  const hasOverdue = inst.days_overdue > 0;
  const hasPenalty = inst.penalty_accrued > 0;

  return (
    <Link href={`/admin/credits/${creditId}/installments/${inst.installment_no}`}>
      <Card className={`hover:shadow-md transition-shadow cursor-pointer border ${stCfg.border}`}>
        <CardContent className="p-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">Cuota {inst.installment_no}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${stCfg.bg} ${stCfg.text}`}>
                {stCfg.label}
              </span>
            </div>
            {hasOverdue && (
              <span className="text-[10px] text-red-600 font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" /> {inst.days_overdue}d atraso
              </span>
            )}
          </div>

          {/* Amounts grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Monto</p>
              <p className="font-mono font-medium">S/ {inst.amount_due.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Pagado</p>
              <p className="font-mono font-medium text-emerald-600">S/ {inst.amount_paid.toFixed(2)}</p>
            </div>
            {hasPenalty && (
              <div>
                <p className="text-muted-foreground">Mora</p>
                <p className="font-mono font-medium text-red-600">S/ {inst.penalty_accrued.toFixed(2)}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Pendiente</p>
              <p className="font-mono font-bold">S/ {inst.outstanding.toFixed(2)}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed">
            <span className="text-[10px] text-muted-foreground">
              Vence: {new Date(inst.due_date).toLocaleDateString('es-PE')}
            </span>
            {inst.paid_at && (
              <span className="text-[10px] text-emerald-600">
                Pagado: {new Date(inst.paid_at).toLocaleDateString('es-PE')}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
