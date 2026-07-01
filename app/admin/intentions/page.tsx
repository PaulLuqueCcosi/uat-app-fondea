import { Target } from 'lucide-react';
import { getMockIntentionsPaginated } from '@/modules/admin';
import { IntentionsTableClient } from '@/components/admin/intentions/IntentionsTableClient';

interface Props {
  searchParams: Promise<{ page?: string; size?: string; q?: string; status?: string }>;
}

export default async function AdminIntentionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = Number(params.size) || 10;
  const query = params.q || undefined;
  const status = params.status || undefined;

  const { data, pagination } = getMockIntentionsPaginated(page, pageSize, query, status);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Target className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Intenciones</h1>
          <p className="text-sm text-muted-foreground">{pagination.totalItems} intenciones registradas</p>
        </div>
      </div>

      <IntentionsTableClient data={data} pagination={pagination} currentStatus={status} />
    </div>
  );
}
