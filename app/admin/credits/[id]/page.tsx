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
import { CreditTimelineSection } from '@/components/admin/credits/detail/CreditTimelineSection';
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
            <CreditTimelineSection entries={timeline} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No se pudo cargar la línea de tiempo</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
