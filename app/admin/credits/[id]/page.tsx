import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getAdminCreditSummary,
  getAdminCreditDetail,
  getAdminCreditInstallments,
  getAdminCreditTransactions,
  getAdminCreditTimeline,
} from '@/modules/admin/admin-credit-detail.service';
import { getCertificatesByCredit } from '@/modules/admin/admin-constancias.service';
import { CreditDetailHeader } from '@/components/admin/credits/detail/CreditDetailHeader';
import { CreditOverviewTab } from '@/components/admin/credits/detail/CreditOverviewTab';
import { CreditInstallmentsSection } from '@/components/admin/credits/detail/CreditInstallmentsSection';
import { CreditTransactionsSection } from '@/components/admin/credits/detail/CreditTransactionsSection';
import { AuditTimeline } from '@/components/admin/shared';
import { BreadcrumbLabel } from '@/components/shared/BreadcrumbLabel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Wallet, LayoutDashboard, History } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminCreditDetailPage({ params }: Props) {
  const { id } = await params;

  const [summary, detail, installments, transactions, timeline, certificates] = await Promise.all([
    getAdminCreditSummary(id),
    getAdminCreditDetail(id),
    getAdminCreditInstallments(id),
    getAdminCreditTransactions(id),
    getAdminCreditTimeline(id),
    getCertificatesByCredit(id),
  ]);

  // A lo sumo una constancia por crédito (credit_id es UNIQUE en la tabla) — ver PayoffCertificate.
  const certificate = certificates[0] ?? null;

  if (!summary) {
    notFound();
  }

  // Fuente de verdad del saldo pendiente: total_outstanding de /detail (CreditQueryReader
  // en el backend) — NUNCA re-sumar `outstanding` por cuota acá. Una cuota NEGOTIATED queda
  // con su outstanding congelado al monto que tenía al negociarse (no refleja nada de lo
  // cobrado después en el crédito de negociación); calcularlo en el frontend duplicaría esa
  // lógica y podía volver a desincronizarse si el backend la ajusta de nuevo.
  const totalOutstanding = detail ? detail.totalOutstanding : summary.totalDue;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <BreadcrumbLabel id={id} label={summary.creditCode} />
      <CreditDetailHeader data={summary} outstanding={totalOutstanding} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList variant="line" className="w-full">
          <TabsTrigger value="overview" className="gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="installments" className="gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Cuotas {installments ? `(${installments.installments.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            Movimientos {transactions ? `(${transactions.transactions.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            Timeline {timeline ? `(${timeline.length})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <CreditOverviewTab data={summary} certificate={certificate} />
        </TabsContent>

        <TabsContent value="installments" className="mt-6">
          {installments ? (
            <CreditInstallmentsSection data={installments} totalOutstanding={totalOutstanding} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No se pudieron cargar las cuotas</p>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          {transactions ? (
            <CreditTransactionsSection data={transactions} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No se pudieron cargar las transacciones</p>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          {timeline ? (
            <AuditTimeline
              entries={timeline}
              moduleLabels={{
                CORE: { label: 'Crédito', color: 'default' },
                PAYMENT: { label: 'Pagos', color: 'secondary' },
                PENALTY: { label: 'Mora', color: 'secondary' },
                NEGOTIATION: { label: 'Negociación', color: 'secondary' },
                AUDIT: { label: 'Auditoría', color: 'outline' },
              }}
              eventLabels={{
                CREDIT_CREATED: 'Crédito creado',
                DISBURSEMENT_COMPLETED: 'Desembolso completado',
                CREDIT_STATUS_CHANGED: 'Cambio de estado',
                CREDIT_CLOSED: 'Crédito liquidado',
                CREDIT_SUSPENDED: 'Crédito suspendido',
                CREDIT_REACTIVATED: 'Crédito reactivado',
                CREDIT_WRITTEN_OFF: 'Crédito castigado',
                INTEREST_REPORTED_TO_FUND: 'Ganancia reportada al fondo',
                LOSS_REPORTED_TO_FUND: 'Pérdida reportada al fondo',
                CREDIT_RESULT_REPORTED_TO_FUND: 'Resultado reportado al fondo',
                CREDIT_CREATION_FAILED: 'Falló la creación del crédito',
                PAYMENT_DECLARATION_SUBMITTED: 'Comprobante enviado por el cliente',
                PAYMENT_DECLARATION_APPROVED: 'Comprobante aprobado',
                PAYMENT_DECLARATION_REJECTED: 'Comprobante rechazado',
                PAYMENT_APPLIED: 'Pago aplicado',
                INSTALLMENT_PAID: 'Cuota liquidada',
                PAYMENT_FAILED: 'Falló el pago',
                INSTALLMENT_ACTIVATED: 'Cuota activada',
                INSTALLMENT_OVERDUE: 'Cuota vencida',
                PENALTY_ACCRUED: 'Mora acumulada',
                PENALTY_PROCESSING_FAILED: 'Falló el cálculo de mora',
                NEGOTIATION_CREDIT_CREATED: 'Crédito de refinanciamiento creado',
                INSTALLMENT_NEGOTIATED: 'Cuota refinanciada',
                AUDIT_PERSIST_ERROR: 'Error al registrar auditoría',
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No se pudo cargar la línea de tiempo</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
