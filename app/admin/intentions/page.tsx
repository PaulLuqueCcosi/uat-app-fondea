import { Target } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAdminIntentions, getAdminAnonymousIntentions, getAdminFunnelMetrics } from '@/modules/admin/admin-intentions.service';
import { IntentionsTableClient } from '@/components/admin/intentions/IntentionsTableClient';
import { AnonymousIntentionsTab } from '@/components/admin/intentions/AnonymousIntentionsTab';
import { FunnelTab } from '@/components/admin/intentions/FunnelTab';

interface Props {
  searchParams: Promise<{
    page?: string;
    size?: string;
    status?: string;
    tab?: string;
    from?: string;
    to?: string;
    amountMin?: string;
    amountMax?: string;
    termDays?: string;
    installmentCount?: string;
    isFirstLoan?: string;
  }>;
}

export default async function AdminIntentionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = Number(params.size) || 10;
  const status = params.status || undefined;
  const tab = params.tab || 'users';

  const filters = {
    status,
    from: params.from,
    to: params.to,
    amountMin: params.amountMin,
    amountMax: params.amountMax,
    termDays: params.termDays,
    installmentCount: params.installmentCount,
    isFirstLoan: params.isFirstLoan,
  };

  // Cargar datos en paralelo
  const [intentionsResult, anonymousResult, funnelMetrics] = await Promise.all([
    getAdminIntentions(page, pageSize, filters),
    getAdminAnonymousIntentions(1, 10),
    getAdminFunnelMetrics(),
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
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="users">Usuarios ({intentionsResult.pagination.totalItems})</TabsTrigger>
          <TabsTrigger value="landing">Landing ({anonymousResult.pagination.total})</TabsTrigger>
          <TabsTrigger value="funnel">Embudo</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <IntentionsTableClient data={intentionsResult.data} pagination={intentionsResult.pagination} currentFilters={filters} />
        </TabsContent>

        <TabsContent value="landing" className="mt-6">
          <AnonymousIntentionsTab initialData={anonymousResult} />
        </TabsContent>

        <TabsContent value="funnel" className="mt-6">
          <FunnelTab metrics={funnelMetrics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
