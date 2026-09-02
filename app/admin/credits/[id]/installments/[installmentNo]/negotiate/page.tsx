import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Handshake } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { getAdminCreditInstallments, getAdminCreditSummary } from '@/modules/admin/admin-credit-detail.service';
import { installmentStatusInfo, INSTALLMENT_STATUS_INFO } from '@/modules/admin/credit-status-labels';
import { getNegotiationOffersByInstallmentAction } from '@/app/actions/negotiation-offer.actions';
import { NegotiationOfferForm } from '@/components/admin/credits/negotiate/NegotiationOfferForm';
import { NegotiationOfferHistory } from '@/components/admin/credits/negotiate/NegotiationOfferHistory';

interface Props {
  params: Promise<{ id: string; installmentNo: string }>;
}

export default async function NegotiateInstallmentPage({ params }: Props) {
  const { id, installmentNo } = await params;
  const no = parseInt(installmentNo, 10);

  if (isNaN(no)) notFound();

  const [installmentsData, creditSummary] = await Promise.all([
    getAdminCreditInstallments(id),
    getAdminCreditSummary(id),
  ]);
  if (!installmentsData) notFound();

  const installment = installmentsData.installments.find((i) => i.installment_no === no);
  if (!installment) notFound();

  const historyResult = await getNegotiationOffersByInstallmentAction(installment.id);
  const history = historyResult.ok ? historyResult.data : [];

  const pendingOffer = history.find((o) => o.status === 'SENT');
  const isEligible = installment.status === 'OVERDUE';

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/credits/${id}/installments/${no}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Handshake className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Negociar {installment.installment_code ?? `cuota #${installment.installment_no}`}</h1>
            <p className="text-xs text-muted-foreground font-mono">
              {creditSummary?.creditCode ?? `Crédito #${id.slice(0, 8)}`}
            </p>
          </div>
        </div>
      </div>

      {/* Bloqueos: cuota no elegible o ya hay una oferta SENT sin resolver */}
      {!isEligible && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Esta cuota no es elegible para negociación</AlertTitle>
          <AlertDescription>
            Solo se pueden negociar cuotas en estado{' '}
            <strong>{INSTALLMENT_STATUS_INFO.OVERDUE.label}</strong>. Esta cuota está{' '}
            <strong>{installmentStatusInfo(installment.status).label}</strong> —{' '}
            {installmentStatusInfo(installment.status).description}
            {' '}Vuelve al{' '}
            <Link href={`/admin/credits/${id}/installments/${no}`} className="underline font-medium">
              detalle de la cuota
            </Link>
            {' '}para ver sus movimientos.
          </AlertDescription>
        </Alert>
      )}

      {isEligible && pendingOffer && (
        <Alert>
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-700">Ya hay una oferta pendiente de firma para esta cuota</AlertTitle>
          <AlertDescription>
            Espera a que el cliente responda (o a que expire) antes de crear una nueva. El backend rechaza intentos duplicados con un error 409.{' '}
            <Link href={`/admin/negotiation-offers/${pendingOffer.id}`} className="underline font-medium">Ver oferta pendiente</Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Contenido: formulario a la izquierda (ocupa el ancho disponible), resumen + historial a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          {isEligible && !pendingOffer ? (
            <NegotiationOfferForm
              installmentId={installment.id}
              creditId={id}
              outstanding={installment.outstanding}
            />
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No hay ninguna acción disponible para esta cuota en este momento.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Datos de la cuota */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Datos de la cuota</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">Monto cuota</p>
                <p className="font-semibold">S/ {installment.amount_due.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">Mora acumulada</p>
                <p className="font-semibold text-red-600">S/ {installment.penalty_accrued.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">Total pendiente</p>
                <p className="font-semibold">S/ {installment.outstanding.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
              </div>
            </CardContent>
          </Card>

          {/* Historial de intentos previos */}
          <NegotiationOfferHistory offers={history} />
        </div>
      </div>
    </div>
  );
}
