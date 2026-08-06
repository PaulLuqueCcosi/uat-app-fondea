import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CalendarDays, Handshake, AlertCircle } from 'lucide-react';
import { getAdminInstallmentDetail } from '@/modules/admin/admin-credit-detail.service';
import { InstallmentTransactionsCard } from '@/components/admin/credits/detail/InstallmentTransactionsCard';

interface Props {
  params: Promise<{ id: string; installmentNo: string }>;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; description: string }> = {
  PENDING: { label: 'Pendiente', variant: 'outline', description: 'Aún no llegó su fecha de vencimiento' },
  CURRENT: { label: 'Vigente', variant: 'default', description: 'Es la cuota activa — próxima a pagar' },
  PARTIALLY_PAID: { label: 'Pago parcial', variant: 'secondary', description: 'Tiene pagos parciales pero no está completa' },
  PAID: { label: 'Pagada', variant: 'default', description: 'Pagada completamente' },
  OVERDUE: { label: 'Vencida', variant: 'destructive', description: 'Venció sin completar el pago' },
  NEGOTIATED: { label: 'Refinanciada', variant: 'secondary', description: 'La deuda se trasladó a un crédito de negociación' },
};

function formatCurrency(value: number) {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const d = new Date(value + (value.includes('T') ? '' : 'T00:00:00'));
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(value: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default async function AdminInstallmentDetailPage({ params }: Props) {
  const { id, installmentNo } = await params;
  const no = parseInt(installmentNo, 10);

  if (isNaN(no)) notFound();

  const data = await getAdminInstallmentDetail(id, no);
  if (!data) notFound();

  const sc = STATUS_CONFIG[data.status] ?? { label: data.status, variant: 'outline' as const, description: '' };
  const isOverdue = data.status === 'OVERDUE';
  const isNegotiated = data.status === 'NEGOTIATED';
  const canNegotiate = isOverdue && data.daysOverdue >= 5;

  // Calculate payment progress
  const totalOwed = data.amountDue + data.penaltyAccrued;
  const totalPaidAmount = data.amountPaid + data.penaltyPaid;
  const paymentProgress = totalOwed > 0 ? Math.min(100, Math.round((totalPaidAmount / totalOwed) * 100)) : 0;

  // Fechas ya formateadas acá (server component) para pasarle strings al client
  // component — evita hydration mismatch por diferencias de ICU Node vs navegador.
  const transactionsForDisplay = data.transactions.map((tx) => ({
    ...tx,
    displayDateTime: formatDateTime(tx.processedAt ?? tx.transactionDate),
    displayTransactionDate: formatDate(tx.transactionDate),
  }));

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/admin/credits/${id}`} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Cuota #{data.installmentNo}</h1>
              <Badge variant={sc.variant}>{sc.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Crédito <Link href={`/admin/credits/${id}`} className="font-mono text-primary hover:underline">#{id.slice(0, 8)}</Link>
              {' · '}Vence {formatDate(data.dueDate)}
            </p>
          </div>
        </div>
        {canNegotiate && (
          <Link href={`/admin/credits/${id}/installments/${no}/negotiate`}>
            <Button size="sm" className="gap-1.5">
              <Handshake className="h-4 w-4" />
              Negociar cuota
            </Button>
          </Link>
        )}
      </div>

      {/* Alert for overdue */}
      {isOverdue && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Cuota vencida — {data.daysOverdue} días de atraso</p>
            <p className="text-xs text-red-600 mt-0.5">
              Mora acumulada: {formatCurrency(data.penaltyAccrued)}.
              {canNegotiate && ' Esta cuota es elegible para negociación.'}
            </p>
          </div>
        </div>
      )}

      {/* Alert for negotiated */}
      {isNegotiated && data.negotiationCreditId && (
        <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <Handshake className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Esta cuota fue refinanciada</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              La deuda se trasladó a un crédito de negociación.{' '}
              <Link href={`/admin/credits/${data.negotiationCreditId}`} className="text-primary hover:underline font-medium">
                Ver crédito de negociación →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Monto de la cuota" value={formatCurrency(data.amountDue)} />
        <KpiCard label="Pagado (cuota)" value={formatCurrency(data.amountPaid)} positive={data.amountPaid > 0} />
        <KpiCard label="Mora acumulada" value={formatCurrency(data.penaltyAccrued)} negative={data.penaltyAccrued > 0} />
        <KpiCard label="Total pendiente" value={formatCurrency(data.outstanding)} highlight />
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Progreso de pago</span>
            <span className="text-xs font-medium">{paymentProgress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                paymentProgress >= 100 ? 'bg-emerald-500' : isOverdue ? 'bg-red-400' : 'bg-primary'
              }`}
              style={{ width: `${paymentProgress}%` }}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-3 border-t">
            <MiniField label="Pendiente cuota" value={formatCurrency(data.installmentOutstanding)} />
            <MiniField label="Pendiente mora" value={formatCurrency(data.penaltyOutstanding)} />
            <MiniField label="Mora pagada" value={formatCurrency(data.penaltyPaid)} />
            <MiniField label="Días de atraso" value={data.daysOverdue > 0 ? `${data.daysOverdue} días` : 'Al día'} alert={data.daysOverdue > 0} />
          </div>
        </CardContent>
      </Card>

      {/* Info detallada */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Información detallada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
            <MiniField label="Fecha vencimiento" value={formatDate(data.dueDate)} />
            <MiniField label="Fecha de pago" value={formatDateTime(data.paidAt)} />
            <MiniField label="Última mora cobrada" value={formatDate(data.lastPenaltyDate)} />
            <MiniField label="Estado" value={sc.description || sc.label} />
            <MiniField label="Creada" value={formatDateTime(data.createdAt)} />
            <MiniField label="Última actualización" value={formatDateTime(data.updatedAt)} />
          </div>
        </CardContent>
      </Card>

      {/* Transacciones */}
      <InstallmentTransactionsCard transactions={transactionsForDisplay} />
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, highlight, positive, negative }: {
  label: string;
  value: string;
  highlight?: boolean;
  positive?: boolean;
  negative?: boolean;
}) {
  let classes = 'bg-card';
  let valueClasses = 'text-foreground';
  if (highlight) { classes = 'border-primary/40 bg-primary/5'; valueClasses = 'text-primary'; }
  else if (negative) { valueClasses = 'text-red-600'; }
  else if (positive) { valueClasses = 'text-emerald-600'; }

  return (
    <div className={`rounded-lg border p-3 ${classes}`}>
      <p className="text-[11px] text-muted-foreground leading-none">{label}</p>
      <p className={`text-lg font-bold mt-1 leading-tight font-mono ${valueClasses}`}>{value}</p>
    </div>
  );
}

function MiniField({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium ${alert ? 'text-red-600' : ''}`}>{value}</p>
    </div>
  );
}
