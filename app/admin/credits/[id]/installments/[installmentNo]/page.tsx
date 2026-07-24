import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CalendarDays, Wallet, History } from 'lucide-react';
import { getAdminInstallmentDetail } from '@/modules/admin/admin-credit-detail.service';
import type { AdminInstallmentDetail } from '@/modules/admin/admin-credit-detail.service';

interface Props {
  params: Promise<{ id: string; installmentNo: string }>;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pendiente', variant: 'outline' },
  CURRENT: { label: 'Vigente', variant: 'default' },
  PARTIALLY_PAID: { label: 'Parcial', variant: 'secondary' },
  PAID: { label: 'Pagada', variant: 'default' },
  OVERDUE: { label: 'Vencida', variant: 'destructive' },
};

const TX_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  DISBURSEMENT: { label: 'Desembolso', color: 'text-blue-600' },
  REPAYMENT: { label: 'Pago', color: 'text-emerald-600' },
  PENALTY_ACCRUAL: { label: 'Mora cobrada', color: 'text-amber-600' },
  PENALTY_PAYMENT: { label: 'Pago mora', color: 'text-orange-600' },
  REVERSAL: { label: 'Reversión', color: 'text-red-600' },
};

function formatCurrency(value: number) {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default async function AdminInstallmentDetailPage({ params }: Props) {
  const { id, installmentNo } = await params;
  const no = parseInt(installmentNo, 10);

  if (isNaN(no)) notFound();

  const data = await getAdminInstallmentDetail(id, no);
  if (!data) notFound();

  const sc = STATUS_CONFIG[data.status] ?? { label: data.status, variant: 'outline' as const };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/admin/credits/${id}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Cuota #{data.installmentNo}</h1>
            <p className="text-xs text-muted-foreground font-mono">Crédito #{id.slice(0, 8)}</p>
          </div>
        </div>
        <Badge variant={sc.variant} className="ml-auto">{sc.label}</Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KpiCard label="Monto cuota" value={formatCurrency(data.amountDue)} />
        <KpiCard label="Pagado" value={formatCurrency(data.amountPaid)} />
        <KpiCard label="Mora acumulada" value={formatCurrency(data.penaltyAccrued)} />
        <KpiCard label="Mora pagada" value={formatCurrency(data.penaltyPaid)} />
        <KpiCard label="Pendiente total" value={formatCurrency(data.outstanding)} highlight />
        <KpiCard label="Días atraso" value={data.daysOverdue > 0 ? `${data.daysOverdue} días` : 'Al día'} />
      </div>

      {/* Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Información</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <InfoItem label="Vencimiento" value={formatDate(data.dueDate)} />
            <InfoItem label="Pagada el" value={formatDateTime(data.paidAt)} />
            <InfoItem label="Última mora cobrada" value={formatDate(data.lastPenaltyDate)} />
            <InfoItem label="Pendiente cuota" value={formatCurrency(data.installmentOutstanding)} />
            <InfoItem label="Pendiente mora" value={formatCurrency(data.penaltyOutstanding)} />
            <InfoItem label="Creada" value={formatDateTime(data.createdAt)} />
            <InfoItem label="Actualizada" value={formatDateTime(data.updatedAt)} />
          </div>
        </CardContent>
      </Card>

      {/* Transacciones */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Transacciones ({data.transactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin transacciones para esta cuota</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Monto</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Método</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Referencia</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Banco</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Fuente</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Creado por</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((tx) => {
                    const typeConfig = TX_TYPE_LABELS[tx.type] ?? { label: tx.type, color: '' };
                    return (
                      <tr key={tx.id} className="border-b last:border-0">
                        <td className="py-2">
                          <span className={`font-medium ${typeConfig.color}`}>{typeConfig.label}</span>
                          {tx.isReversed && <Badge variant="destructive" className="ml-1 text-[9px]">REV</Badge>}
                        </td>
                        <td className="py-2 text-right font-mono">{formatCurrency(tx.amount)}</td>
                        <td className="py-2">{formatDateTime(tx.processedAt ?? tx.transactionDate)}</td>
                        <td className="py-2">{tx.paymentMethod ?? '—'}</td>
                        <td className="py-2 font-mono text-[10px]">{tx.referenceNumber ?? '—'}</td>
                        <td className="py-2">{tx.bankName ?? '—'}</td>
                        <td className="py-2">{tx.source ?? '—'}</td>
                        <td className="py-2 text-muted-foreground">{tx.createdBy ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auditoría */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4" /> Auditoría ({data.auditEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.auditEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin eventos de auditoría</p>
          ) : (
            <div className="space-y-3">
              {data.auditEvents.map((e) => (
                <div key={e.id} className="flex items-start gap-3 border-l-2 border-muted pl-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{e.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      <span>{e.eventType}</span>
                      <span>·</span>
                      <span>{e.triggeredBy}</span>
                      <span>·</span>
                      <span>{formatDateTime(e.createdAt)}</span>
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

// ── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? 'border-primary/30 bg-primary/5' : ''}`}>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-primary' : ''}`}>{value}</p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
