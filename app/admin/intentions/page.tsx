import { Target } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAdminIntentions, getAdminAnonymousIntentions } from '@/modules/admin/admin-intentions.service';
import { getProductFilterOptions } from '@/modules/admin/admin-product-options.service';
import { IntentionsTableClient } from '@/components/admin/intentions/IntentionsTableClient';
import { AnonymousIntentionsTab } from '@/components/admin/intentions/AnonymousIntentionsTab';

interface Props {
  searchParams: Promise<{
    page?: string;
    size?: string;
    lpage?: string;
    lsize?: string;
    status?: string;
    tab?: string;
    from?: string;
    to?: string;
    amountMin?: string;
    amountMax?: string;
    termDays?: string;
    installmentCount?: string;
    isFirstLoan?: string;
    sort?: string;
    clientIp?: string;
    search?: string;
  }>;
}

export default async function AdminIntentionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const tab = params.tab === 'landing' ? 'landing' : 'users';

  // Users tab pagination & filters
  const userPage = Number(params.page) || 1;
  const userPageSize = Number(params.size) || 10;
  const status = params.status || undefined;

  const filters = {
    status,
    from: params.from,
    to: params.to,
    amountMin: params.amountMin,
    amountMax: params.amountMax,
    termDays: params.termDays,
    installmentCount: params.installmentCount,
    isFirstLoan: params.isFirstLoan,
    sort: params.sort,
    search: params.search,
  };

  // Landing tab pagination & filters (parámetros independientes para no cruzarse con usuarios)
  const landingPage = Number(params.lpage) || 1;
  const landingPageSize = Number(params.lsize) || 10;
  const landingFilters = {
    from: params.from,
    to: params.to,
    amountMin: params.amountMin,
    amountMax: params.amountMax,
    termDays: params.termDays,
    installmentCount: params.installmentCount,
    clientIp: params.clientIp ?? params.search,
  };

  // Cargar datos en paralelo
  const [intentionsResult, anonymousResult, productOptions] = await Promise.all([
    getAdminIntentions(userPage, userPageSize, filters),
    getAdminAnonymousIntentions(landingPage, landingPageSize, landingFilters),
    getProductFilterOptions(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Target className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Intenciones</h1>
          <p className="text-sm text-muted-foreground">
            Flujo completo: Landing → Intención → Solicitud
          </p>
        </div>
      </div>

      <Tabs defaultValue={tab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="users">Usuarios ({intentionsResult.pagination.totalItems})</TabsTrigger>
          <TabsTrigger value="landing">Landing ({anonymousResult.pagination.totalItems})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <IntentionsTableClient
            data={intentionsResult.data}
            pagination={intentionsResult.pagination}
            currentFilters={filters}
            termDaysOptions={productOptions.termDays}
            installmentCountOptions={productOptions.installmentCounts}
          />
        </TabsContent>

        <TabsContent value="landing" className="mt-6">
          <AnonymousIntentionsTab
            data={anonymousResult.data}
            pagination={anonymousResult.pagination}
            currentFilters={landingFilters}
            termDaysOptions={productOptions.termDays}
            installmentCountOptions={productOptions.installmentCounts}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
