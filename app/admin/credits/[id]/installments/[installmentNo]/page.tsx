import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Handshake, AlertCircle } from 'lucide-react';
import { DetailPageHeader } from '@/components/admin/shared';
import { getAdminInstallmentDetail, getAdminCreditSummary } from '@/modules/admin/admin-credit-detail.service';
import { installmentStatusInfo } from '@/modules/admin/credit-status-labels';
import { InstallmentTransactionsCard } from '@/components/admin/credits/detail/InstallmentTransactionsCard';
import { InstallmentChargesTable } from '@/components/admin/credits/detail/InstallmentChargesTable';
import { InstallmentPaymentsCard } from '@/components/admin/credits/detail/InstallmentPaymentsCard';
import { RegisterPaymentDialog } from '@/components/admin/credits/detail/RegisterPaymentDialog';
import { KpiCard } from '@/components/admin/shared';
import { DataRow } from '@/components/ui/data-row';
import { BreadcrumbLabel } from '@/components/shared/BreadcrumbLabel';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/admin-formatters';
import {
  daysText,
  daysUntilNextStage,
  stageDaysText,
  stageForDay,
  stageRuleLines,
  stageShortLabel,
} from '@/modules/shared/penalty-rule-text';

interface Props {
  params: Promise<{ id: string; installmentNo: string }>;
}

// Labels y descripciones centralizados en `modules/admin/credit-status-labels`.

export default async function AdminInstallmentDetailPage({ params }: Props) {
  const { id, installmentNo } = await params;
  const no = parseInt(installmentNo, 10);

  if (isNaN(no)) notFound();

  const [data, creditSummary] = await Promise.all([
    getAdminInstallmentDetail(id, no),
    getAdminCreditSummary(id),
  ]);
  if (!data) notFound();

  const sc = installmentStatusInfo(data.status);
  const isOverdue = data.status === 'OVERDUE';
  const isNegotiated = data.status === 'NEGOTIATED';
  const canNegotiate = isOverdue && data.daysOverdue >= 5;
  const canRegisterPayment = data.status !== 'PAID' && !isNegotiated;

  // Stage of the credit's frozen penalty config that today's delay falls in, and when it changes.
  const stages = creditSummary?.penaltyConfig?.stages ?? [];
  const currentStage = isOverdue ? stageForDay(stages, data.daysOverdue) : null;
  const daysToNextStage = isOverdue ? daysUntilNextStage(stages, data.daysOverdue) : null;

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
      <BreadcrumbLabel id={id} label={creditSummary?.creditCode} />
      <DetailPageHeader
        icon={<CalendarDays className="h-5 w-5 text-primary" />}
        title={data.installmentCode ?? `Cuota #${data.installmentNo}`}
        subtitle={
          <>
            Crédito{' '}
            <Link href={`/admin/credits/${id}`} className="font-mono text-primary hover:underline">
              {creditSummary?.creditCode ?? `#${id.slice(0, 8)}`}
            </Link>
            {' · '}Vence {formatDate(data.dueDate)}
          </>
        }
        badge={{ label: sc.label, variant: sc.variant }}
        backHref={`/admin/credits/${id}`}
        backLabel="Crédito"
      >
        {canRegisterPayment && <RegisterPaymentDialog creditId={id} installmentNo={no} />}
        {canNegotiate && (
          <Link href={`/admin/credits/${id}/installments/${no}/negotiate`}>
            <Button size="sm" className="gap-1.5">
              <Handshake className="h-4 w-4" />
              Negociar cuota
            </Button>
          </Link>
        )}
      </DetailPageHeader>

      {/* Mora por días: where the installment is today and what each day costs (only when overdue) */}
      {isOverdue && (
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-100">
                <AlertCircle className="h-5 w-5 text-error-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Mora por días</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Cuota vencida con {daysText(data.daysOverdue)} de atraso.
                  {canNegotiate && ' Esta cuota es elegible para negociación.'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 border-t pt-3">
              <DataRow
                label="Tramo actual"
                value={
                  currentStage
                    ? `${stageShortLabel(currentStage)}${currentStage.label ? ` (${stageDaysText(currentStage.fromDay, currentStage.toDay)})` : ''}`
                    : 'Sin tramo configurado'
                }
              />
              <DataRow label="Mora acumulada" value={formatCurrency(data.penaltyAccrued)} valueClassName="text-error-700" />
              <DataRow
                label="Cambio de tramo"
                value={daysToNextStage !== null ? `Cambia de tramo en ${daysText(daysToNextStage)}` : 'Es el último tramo'}
              />
            </div>
            {currentStage && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Qué se cobra en este tramo</p>
                <ul className="space-y-0.5">
                  {stageRuleLines(currentStage.rules).map((line) => (
                    <li key={line} className="text-xs text-foreground">{line}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isNegotiated && data.negotiationCreditId && (
        <Card>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100">
                <Handshake className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Esta cuota fue refinanciada</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  La deuda se trasladó a un crédito de negociación y ya no se cobra desde esta cuota.
                </p>
              </div>
            </div>
            <Link href={`/admin/credits/${data.negotiationCreditId}`} className="shrink-0">
              <Button size="sm" variant="outline" className="gap-1.5 w-full sm:w-auto">
                <Handshake className="h-4 w-4" />
                Ver crédito de negociación
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Monto de la cuota" value={formatCurrency(data.amountDue)} mono />
        <KpiCard label="Pagado (cuota)" value={formatCurrency(data.amountPaid)} positive={data.amountPaid > 0} mono />
        <KpiCard label="Mora acumulada" value={formatCurrency(data.penaltyAccrued)} negative={data.penaltyAccrued > 0} mono />
        <KpiCard label="Total pendiente" value={formatCurrency(data.outstanding)} highlight mono />
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
            <DataRow label="Pendiente cuota" value={formatCurrency(data.installmentOutstanding)} />
            <DataRow label="Pendiente mora" value={formatCurrency(data.penaltyOutstanding)} />
            <DataRow label="Mora pagada" value={formatCurrency(data.penaltyPaid)} />
            <DataRow label="Días de atraso" value={data.daysOverdue > 0 ? `${data.daysOverdue} días` : 'Al día'} alert={data.daysOverdue > 0} />
          </div>
        </CardContent>
      </Card>

      {/* Detalle de la cuota: capital, interés por tipo y mora, con lo pagado y lo que falta (admin) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Detalle de la cuota</CardTitle>
        </CardHeader>
        <CardContent>
          <InstallmentChargesTable items={data.charges} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">A dónde entró cada pago</CardTitle>
        </CardHeader>
        <CardContent>
          <InstallmentPaymentsCard payments={data.payments} />
        </CardContent>
      </Card>

      {/* Info detallada */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Información detallada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
            <DataRow label="Fecha vencimiento" value={formatDate(data.dueDate)} />
            <DataRow label="Fecha de pago" value={formatDateTime(data.paidAt)} />
            <DataRow label="Última mora cobrada" value={formatDate(data.lastPenaltyDate)} />
            <DataRow label="Estado" value={sc.description || sc.label} />
            <DataRow label="Creada" value={formatDateTime(data.createdAt)} />
            <DataRow label="Última actualización" value={formatDateTime(data.updatedAt)} />
          </div>
        </CardContent>
      </Card>

      {/* Transacciones */}
      <InstallmentTransactionsCard transactions={transactionsForDisplay} />
    </div>
  );
}
