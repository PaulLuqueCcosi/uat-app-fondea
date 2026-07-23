import { notFound } from 'next/navigation';
import { ArrowLeft, Receipt, History, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminCreditFullDetail } from '@/modules/admin/admin-credit-detail.service';
import type { InstallmentStatus } from '@/modules/admin/admin-credit-detail.service';

const INSTALLMENT_STATUS: Record<InstallmentStatus, { label: string; bg: string; text: string }> = {
  PENDING: { label: 'Pendiente', bg: 'bg-gray-100', text: 'text-gray-700' },
  CURRENT: { label: 'Activa', bg: 'bg-blue-100', text: 'text-blue-700' },
  PARTIALLY_PAID: { label: 'Pago Parcial', bg: 'bg-amber-100', text: 'text-amber-700' },
  PAID: { label: 'Pagada', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  OVERDUE: { label: 'Vencida', bg: 'bg-red-100', text: 'text-red-700' },
};

interface Props {
  params: Promise<{ id: string; installmentNo: string }>;
}

export default async function AdminInstallmentDetailPage({ params }: Props) {
  const { id, installmentNo } = await params;
  const data = await getAdminCreditFullDetail(id);

  if (!data) {
    notFound();
  }

  const inst = data.installments.find(i => i.installment_no === Number(installmentNo));
  if (!inst) {
    notFound();
  }

  const auditEvents = data.installment_audit_events.filter(
    e => e.installment_no === Number(installmentNo)
  );

  const stCfg = INSTALLMENT_STATUS[inst.status];
  const penaltyOutstanding = Math.max(0, inst.penalty_accrued - inst.penalty_paid);
  const installmentOutstanding = Math.max(0, inst.amount_due - inst.amount_paid);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Link href={`/admin/credits/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" /> Crédito {id.slice(0, 8)}…
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
          <Receipt className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Cuota {inst.installment_no}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${stCfg.bg} ${stCfg.text}`}>
              {stCfg.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Vencimiento: {new Date(inst.due_date).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Monto de cuota</p>
            </div>
            <p className="text-2xl font-bold">S/ {inst.amount_due.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Pagado</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">S/ {inst.amount_paid.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {inst.amount_due > 0 ? Math.round((inst.amount_paid / inst.amount_due) * 100) : 0}% del monto
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-xs text-muted-foreground">Mora acumulada</p>
            </div>
            <p className="text-2xl font-bold text-red-600">S/ {inst.penalty_accrued.toFixed(2)}</p>
            {inst.penalty_paid > 0 && (
              <p className="text-[10px] text-emerald-600 mt-0.5">
                Mora pagada: S/ {inst.penalty_paid.toFixed(2)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Total pendiente</p>
            </div>
            <p className="text-2xl font-bold text-primary">S/ {inst.outstanding.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Cuota: S/ {installmentOutstanding.toFixed(2)} + Mora: S/ {penaltyOutstanding.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Desglose</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Monto de cuota</span>
                <span className="text-sm font-mono font-medium">S/ {inst.amount_due.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Pagado a cuota</span>
                <span className="text-sm font-mono font-medium text-emerald-600">- S/ {inst.amount_paid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Mora acumulada</span>
                <span className="text-sm font-mono font-medium text-red-600">+ S/ {inst.penalty_accrued.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Mora pagada</span>
                <span className="text-sm font-mono font-medium text-emerald-600">- S/ {inst.penalty_paid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 font-bold">
                <span className="text-sm">SALDO PENDIENTE</span>
                <span className="text-sm font-mono">S/ {inst.outstanding.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Estado y Fechas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Estado</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${stCfg.bg} ${stCfg.text}`}>
                  {stCfg.label}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Fecha de vencimiento</span>
                <span className="text-sm font-medium">{new Date(inst.due_date).toLocaleDateString('es-PE')}</span>
              </div>
              {inst.days_overdue > 0 && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-red-500" /> Días de atraso
                  </span>
                  <span className="text-sm font-bold text-red-600">{inst.days_overdue} días</span>
                </div>
              )}
              {inst.paid_at && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Pagada el</span>
                  <span className="text-sm font-medium text-emerald-600">
                    {new Date(inst.paid_at).toLocaleString('es-PE')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4" /> Historial de esta cuota
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Sin eventos registrados para esta cuota</p>
          ) : (
            <div className="space-y-4">
              {auditEvents.map((event) => (
                <div key={event.id} className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{event.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(event.created_at).toLocaleString('es-PE')}
                      </span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{event.triggered_by}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                        {event.event_type}
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
  );
}
