import { CreditCard, Handshake } from 'lucide-react';
import { getAdminCredits } from '@/modules/admin/admin-credits.service';
import type { CreditStatus } from '@/modules/admin/admin-credits.service';
import { CreditsTableClient } from '@/components/admin/credits/CreditsTableClient';
import { NegotiationCreditsTable } from '@/components/admin/credits/NegotiationCreditsTable';
import { NegotiationStatusFilter } from '@/components/admin/credits/NegotiationStatusFilter';
import { getAdminNegotiationOffersAction } from '@/app/actions/negotiation-offer.actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { NegotiationOfferStatus } from '@/modules/negotiation-offers';

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
    nstatus?: string;
  }>;
}

export default async function AdminCreditsPage({ searchParams }: Props) {
  const params = await searchParams;
  const tab = params.tab === 'negotiation' ? 'negotiation' : 'standard';

  const page = Number(params.page) || 1;
  const pageSize = Number(params.size) || 20;

  const [{ data, pagination }, negotiationResult] = await Promise.all([
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
    getAdminNegotiationOffersAction(params.nstatus as NegotiationOfferStatus | undefined),
  ]);

  const negotiationOffers = negotiationResult.ok ? negotiationResult.data : [];
  const pendingCount = negotiationOffers.filter((o) => o.status === 'SENT').length;

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

      <Tabs defaultValue={tab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-lg">
          <TabsTrigger value="standard" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Créditos
          </TabsTrigger>
          <TabsTrigger value="negotiation" className="gap-1.5">
            <Handshake className="h-3.5 w-3.5" />
            Negociación
            {pendingCount > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 text-white text-[10px] px-1.5 py-0.5 leading-none">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standard" className="mt-6">
          <CreditsTableClient data={data} pagination={pagination} />
        </TabsContent>

        <TabsContent value="negotiation" className="mt-6 space-y-4">
          <p className="text-xs text-muted-foreground">
            Un crédito de negociación sigue siendo un crédito normal — nace siempre de una oferta aceptada.
            Esta vista muestra las ofertas; usa &quot;Ver crédito&quot; para entrar al detalle del crédito ya creado.
          </p>
          <NegotiationStatusFilter />
          <NegotiationCreditsTable offers={negotiationOffers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
