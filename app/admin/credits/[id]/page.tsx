import { notFound } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileImage, History, Wallet } from 'lucide-react';
import { getAdminCreditFullDetail } from '@/modules/admin/admin-credit-detail.service';
import { CreditDetailHeader } from '@/components/admin/credits/detail/CreditDetailHeader';
import { CreditSummaryCards } from '@/components/admin/credits/detail/CreditSummaryCards';
import { CreditInfoGrid } from '@/components/admin/credits/detail/CreditInfoGrid';
import { CreditClientCard } from '@/components/admin/credits/detail/CreditClientCard';
import { CreditDisbursementCard } from '@/components/admin/credits/detail/CreditDisbursementCard';
import { CreditPenaltyConfigCard } from '@/components/admin/credits/detail/CreditPenaltyConfigCard';
import { CreditInstallmentsTable } from '@/components/admin/credits/detail/CreditInstallmentsTable';
import { CreditTransactionsTable } from '@/components/admin/credits/detail/CreditTransactionsTable';
import { CreditAuditTimeline } from '@/components/admin/credits/detail/CreditAuditTimeline';
import { CreditApplicationPanel } from '@/components/admin/credits/detail/CreditApplicationPanel';
import { CreditDocumentsPanel } from '@/components/admin/credits/detail/CreditDocumentsPanel';
import { CreditPaymentActions } from '@/components/admin/credits/detail/CreditPaymentActions';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminCreditDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getAdminCreditFullDetail(id);

  if (!data) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <CreditDetailHeader data={data} />

      <CreditSummaryCards data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <CreditInfoGrid data={data} />
          <CreditInstallmentsTable data={data} />
        </div>
        <div className="space-y-4">
          <CreditClientCard data={data} />
          <CreditDisbursementCard data={data} />
          <CreditApplicationPanel data={data} />
          <CreditPenaltyConfigCard data={data} />
          <CreditPaymentActions data={data} />
        </div>
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid grid-cols-1 sm:grid-cols-3 w-full max-w-xl">
          <TabsTrigger value="transactions" className="gap-1.5 text-xs">
            <Wallet className="h-3.5 w-3.5" /> Transacciones
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5 text-xs">
            <History className="h-3.5 w-3.5" /> Auditoría
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5 text-xs">
            <FileImage className="h-3.5 w-3.5" /> Documentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-4">
          <CreditTransactionsTable data={data} />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <CreditAuditTimeline data={data} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <CreditDocumentsPanel data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
