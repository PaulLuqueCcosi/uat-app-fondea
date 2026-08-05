import { BarChart3, Users, Handshake, TrendingUp } from 'lucide-react';
import { getAdminMoraClients, getAdminPaymentAgreements } from '@/modules/admin/admin-collections.service';
import { MoraClientsTable } from '@/components/admin/collections/MoraClientsTable';
import { PaymentAgreementsTable } from '@/components/admin/collections/PaymentAgreementsTable';
import { CollectionsAnalytics } from '@/components/admin/collections/CollectionsAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MoraClientsFilters } from '@/modules/admin/admin-collections.types';

interface Props {
  searchParams: Promise<{
    tab?: string;
    // Mora (R24)
    page?: string;
    size?: string;
    q?: string;
    city?: string;
    managementStatus?: string;
    minDaysOverdue?: string;
    sortBy?: string;
    sortDir?: string;
    // Agreements (R25)
    apage?: string;
    asize?: string;
  }>;
}

export default async function AdminCollectionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const tab = params.tab ?? 'mora';

  // R24 pagination
  const page = Number(params.page) || 1;
  const pageSize = Number(params.size) || 20;

  // R25 pagination (prefixed with 'a' to avoid collision)
  const aPage = Number(params.apage) || 1;
  const aPageSize = Number(params.asize) || 20;

  const filters: MoraClientsFilters = {
    search: params.q,
    city: params.city,
    managementStatus: params.managementStatus,
    minDaysOverdue: params.minDaysOverdue ? Number(params.minDaysOverdue) : undefined,
    sortBy: (params.sortBy as MoraClientsFilters['sortBy']) ?? undefined,
    sortDir: (params.sortDir as MoraClientsFilters['sortDir']) ?? undefined,
  };

  const [moraResult, agreementsResult] = await Promise.all([
    getAdminMoraClients(page, pageSize, filters),
    getAdminPaymentAgreements(aPage, aPageSize),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Cobranza</h1>
          <p className="text-sm text-muted-foreground">
            Monitoreo de mora, acuerdos de pago y analytics — M3
          </p>
        </div>
      </div>

      <Tabs defaultValue={tab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="mora" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Mora
            {moraResult.pagination.totalItems > 0 && (
              <span className="ml-1 rounded-full bg-red-500 text-white text-[10px] px-1.5 py-0.5 leading-none">
                {moraResult.pagination.totalItems}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="agreements" className="gap-1.5">
            <Handshake className="h-3.5 w-3.5" />
            Acuerdos
            {agreementsResult.pagination.totalItems > 0 && (
              <span className="ml-1 rounded-full bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 leading-none">
                {agreementsResult.pagination.totalItems}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mora" className="mt-6">
          <MoraClientsTable data={moraResult.data} pagination={moraResult.pagination} />
        </TabsContent>

        <TabsContent value="agreements" className="mt-6">
          <PaymentAgreementsTable data={agreementsResult.data} pagination={agreementsResult.pagination} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <CollectionsAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
