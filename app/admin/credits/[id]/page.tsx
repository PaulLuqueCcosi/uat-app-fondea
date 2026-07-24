import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import {
  getAdminCreditSummary,
  getAdminCreditInstallments,
  getAdminCreditTransactions,
} from '@/modules/admin/admin-credit-detail.service';
import { CreditSummarySection } from '@/components/admin/credits/detail/CreditSummarySection';
import { CreditInstallmentsSection } from '@/components/admin/credits/detail/CreditInstallmentsSection';
import { CreditTransactionsSection } from '@/components/admin/credits/detail/CreditTransactionsSection';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminCreditDetailPage({ params }: Props) {
  const { id } = await params;

  // Fetch en paralelo
  const [summary, installments, transactions] = await Promise.all([
    getAdminCreditSummary(id),
    getAdminCreditInstallments(id),
    getAdminCreditTransactions(id),
  ]);

  if (!summary) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <CreditSummarySection data={summary} />

      {installments && (
        <CreditInstallmentsSection data={installments} />
      )}

      {transactions && (
        <CreditTransactionsSection data={transactions} />
      )}
    </div>
  );
}
