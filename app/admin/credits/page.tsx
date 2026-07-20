import { CreditCard } from 'lucide-react';
import { getAdminCredits } from '@/modules/admin/admin-credits.service';
import { CreditsTableClient } from '@/components/admin/credits/CreditsTableClient';

interface Props {
  searchParams: Promise<{
    page?: string;
    size?: string;
    q?: string;
    status?: string;
    term_days?: string;
    min_amount?: string;
    max_amount?: string;
    disbursed_from?: string;
    disbursed_to?: string;
    overdue_only?: string;
    min_days_mora?: string;
    passport_level?: string;
    city?: string;
  }>;
}

export default async function AdminCreditsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = Number(params.size) || 20;

  const { data, pagination } = await getAdminCredits(page, pageSize, {
    search: params.q,
    status: params.status as any,
    termDays: params.term_days ? Number(params.term_days) : undefined,
    minAmount: params.min_amount ? Number(params.min_amount) : undefined,
    maxAmount: params.max_amount ? Number(params.max_amount) : undefined,
    disbursedFrom: params.disbursed_from,
    disbursedTo: params.disbursed_to,
    overdueOnly: params.overdue_only === 'true' ? true : undefined,
    minDaysMora: params.min_days_mora ? Number(params.min_days_mora) : undefined,
    passportLevel: params.passport_level,
    city: params.city,
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Cartera de Préstamos</h1>
          <p className="text-sm text-muted-foreground">
            {pagination.totalItems} préstamos registrados — tabla maestra M2
          </p>
        </div>
      </div>

      {/* Tabla con paginación y filtros */}
      <CreditsTableClient data={data} pagination={pagination} />
    </div>
  );
}
