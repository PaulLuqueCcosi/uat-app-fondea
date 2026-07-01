import { Target } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMockIntentionsPaginated, mockCalcIntentions, mockCalcMetrics } from '@/modules/admin';
import { IntentionsTableClient } from '@/components/admin/intentions/IntentionsTableClient';
import { CalcIntentionsTab } from '@/components/admin/intentions/CalcIntentionsTab';

interface Props {
  searchParams: Promise<{ page?: string; size?: string; q?: string; status?: string; tab?: string }>;
}

export default async function AdminIntentionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = Number(params.size) || 10;
  const query = params.q || undefined;
  const status = params.status || undefined;
  const tab = params.tab || 'users';

  const { data, pagination } = getMockIntentionsPaginated(page, pageSize, query, status);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Target className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Intenciones</h1>
          <p className="text-sm text-muted-foreground">Intenciones de préstamo de usuarios y landing</p>
        </div>
      </div>

      <Tabs defaultValue={tab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="users">Usuarios ({pagination.totalItems})</TabsTrigger>
          <TabsTrigger value="landing">Landing / Anónimas ({mockCalcIntentions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <IntentionsTableClient data={data} pagination={pagination} currentStatus={status} />
        </TabsContent>

        <TabsContent value="landing" className="mt-6">
          <CalcIntentionsTab intentions={mockCalcIntentions} metrics={mockCalcMetrics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
