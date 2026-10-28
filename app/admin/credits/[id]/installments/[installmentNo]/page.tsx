import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Handshake } from 'lucide-react';
import { DetailPageHeader } from '@/components/admin/shared';
import { getAdminInstallmentDetail, getAdminCreditSummary } from '@/modules/admin/admin-credit-detail.service';
import { installmentStatusInfo } from '@/modules/admin/credit-status-labels';
import { InstallmentTransactionsCard } from '@/components/admin/credits/detail/InstallmentTransactionsCard';
import { InstallmentChargesTable } from '@/components/admin/credits/detail/InstallmentChargesTable';
import { InstallmentMoraTimeline } from '@/components/admin/credits/detail/InstallmentMoraTimeline';
import { InstallmentPaymentsCard } from '@/components/admin/credits/detail/InstallmentPaymentsCard';
import { RegisterPaymentDialog } from '@/components/admin/credits/detail/RegisterPaymentDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InstallmentSummaryCard } from '@/components/admin/credits/detail/InstallmentSummaryCard';
import { DataRow } from '@/components/ui/data-row';
import { BreadcrumbLabel } from '@/components/shared/BreadcrumbLabel';
import { formatDate, formatDateTime } from '@/lib/admin-formatters';
import {
  daysUntilNextStage,
  stageDaysText,
  stageForDay,
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

      {/* Resumen: cuota (capital + interés) + mora = total, con el desglose plegado */}
      <InstallmentSummaryCard
        charges={data.charges}
        fallback={{
          amountDue: data.amountDue,
          amountPaid: data.amountPaid,
          penaltyAccrued: data.penaltyAccrued,
          penaltyPaid: data.penaltyPaid,
        }}
        mora={
          isOverdue
            ? {
                daysOverdue: data.daysOverdue,
                stageText: currentStage
                  ? `${stageShortLabel(currentStage)}${currentStage.label ? ` (${stageDaysText(currentStage.fromDay, currentStage.toDay)})` : ''}`
                  : null,
                daysToNextStage,
              }
            : null
        }
      />

      {/* Detalle a pedido: una pestaña a la vez. Si hay mora día por día, esa abre primero. */}
      <Tabs defaultValue={data.penaltyDays.length > 0 ? 'mora' : 'detail'} className="w-full">
        <TabsList variant="line" className="w-full">
          <TabsTrigger value="detail">Detalle de la cuota</TabsTrigger>
          {(isOverdue || data.penaltyDays.length > 0) && (
            <TabsTrigger value="mora">Mora día por día ({data.penaltyDays.length})</TabsTrigger>
          )}
          <TabsTrigger value="payments">Pagos ({data.payments.length})</TabsTrigger>
          <TabsTrigger value="transactions">Movimientos ({data.transactions.length})</TabsTrigger>
          <TabsTrigger value="info">Información</TabsTrigger>
        </TabsList>

        <TabsContent value="detail" className="mt-4">
          <Card>
            <CardContent>
              <InstallmentChargesTable items={data.charges} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mora" className="mt-4">
          <Card>
            <CardContent>
              <InstallmentMoraTimeline days={data.penaltyDays} penaltyAccrued={data.penaltyAccrued} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">A dónde entró cada pago</CardTitle>
            </CardHeader>
            <CardContent>
              <InstallmentPaymentsCard payments={data.payments} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <InstallmentTransactionsCard transactions={transactionsForDisplay} />
        </TabsContent>

        <TabsContent value="info" className="mt-4">
          <Card>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
