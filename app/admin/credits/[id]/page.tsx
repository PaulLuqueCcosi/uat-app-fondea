import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getAdminCreditSummary,
  getAdminCreditInstallments,
  getAdminCreditTransactions,
} from '@/modules/admin/admin-credit-detail.service';
import { CreditDetailHeader } from '@/components/admin/credits/detail/CreditDetailHeader';
import { CreditOverviewTab } from '@/components/admin/credits/detail/CreditOverviewTab';
import { CreditInstallmentsSection } from '@/components/admin/credits/detail/CreditInstallmentsSection';
import { CreditTransactionsSection } from '@/components/admin/credits/detail/CreditTransactionsSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Wallet, LayoutDashboard } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminCreditDetailPage({ params }: Props) {
  const { id } = await params;

  const [summary, installments, transactions] = await Promise.all([
    getAdminCreditSummary(id),
    getAdminCreditInstallments(id),
    getAdminCreditTransactions(id),
  ]);

  if (!summary) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl">
      <CreditDetailHeader data={summary} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full max-w-md">
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
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <CreditOverviewTab data={summary} />
        </TabsContent>

        <TabsContent value="installments" className="mt-6">
          {installments ? (
            <CreditInstallmentsSection data={installments} />
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
      </Tabs>
    </div>
  );
}
