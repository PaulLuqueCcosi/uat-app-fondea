import { CreditCard, Handshake } from 'lucide-react';
import { getAdminCredits } from '@/modules/admin/admin-credits.service';
import type { CreditStatus } from '@/modules/admin/admin-credits.service';
import { CreditsTableClient } from '@/components/admin/credits/CreditsTableClient';
import { CreditsHelpDialog } from '@/components/admin/credits/CreditsHelpDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Props {
  searchParams: Promise<{
    tab?: string;
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
    // Tabla de negociación — mismos filtros, prefijados con n_ para no pisar los de arriba
    n_page?: string;
    n_size?: string;
    n_q?: string;
    n_status?: string;
    n_term_days?: string;
    n_min_amount?: string;
    n_max_amount?: string;
    n_disbursed_from?: string;
    n_disbursed_to?: string;
    n_overdue_only?: string;
    n_min_days_mora?: string;
    n_passport_level?: string;
    n_city?: string;
  }>;
}

export default async function AdminCreditsPage({ searchParams }: Props) {
  const params = await searchParams;
  const tab = params.tab === 'negotiation' ? 'negotiation' : 'standard';

  const page = Number(params.page) || 1;
  const pageSize = Number(params.size) || 20;

  const negotiationPage = Number(params.n_page) || 1;
  const negotiationPageSize = Number(params.n_size) || 20;

  const [{ data, pagination }, negotiationCredits] = await Promise.all([
    getAdminCredits(page, pageSize, {
      search: params.q,
      status: params.status as CreditStatus | undefined,
      termDays: params.term_days ? Number(params.term_days) : undefined,
      minAmount: params.min_amount ? Number(params.min_amount) : undefined,
      maxAmount: params.max_amount ? Number(params.max_amount) : undefined,
      disbursedFrom: params.disbursed_from,
      disbursedTo: params.disbursed_to,
      overdueOnly: params.overdue_only === 'true' ? true : undefined,
      minDaysMora: params.min_days_mora ? Number(params.min_days_mora) : undefined,
      passportLevel: params.passport_level,
      city: params.city,
    }),
    getAdminCredits(negotiationPage, negotiationPageSize, {
      creditType: 'NEGOTIATION',
      search: params.n_q,
      status: params.n_status as CreditStatus | undefined,
      termDays: params.n_term_days ? Number(params.n_term_days) : undefined,
      minAmount: params.n_min_amount ? Number(params.n_min_amount) : undefined,
      maxAmount: params.n_max_amount ? Number(params.n_max_amount) : undefined,
      disbursedFrom: params.n_disbursed_from,
      disbursedTo: params.n_disbursed_to,
      overdueOnly: params.n_overdue_only === 'true' ? true : undefined,
      minDaysMora: params.n_min_days_mora ? Number(params.n_min_days_mora) : undefined,
      passportLevel: params.n_passport_level,
      city: params.n_city,
    }),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
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
        <CreditsHelpDialog />
      </div>

      <Tabs defaultValue={tab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-lg">
          <TabsTrigger value="standard" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Créditos
          </TabsTrigger>
          <TabsTrigger value="negotiation" className="gap-1.5">
            <Handshake className="h-3.5 w-3.5" />
            Negociación
            {negotiationCredits.pagination.totalItems > 0 && (
              <span className="ml-1 rounded-full bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 leading-none">
                {negotiationCredits.pagination.totalItems}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standard" className="mt-6">
          <CreditsTableClient data={data} pagination={pagination} />
        </TabsContent>

        <TabsContent value="negotiation" className="mt-6">
          <CreditsTableClient
            data={negotiationCredits.data}
            pagination={negotiationCredits.pagination}
            paramPrefix="n_"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
