import { FileText } from 'lucide-react';
import { getMockApplicationsPaginated } from '@/modules/admin';
import { ApplicationsTableClient } from '@/components/admin/applications/ApplicationsTableClient';

interface Props {
  searchParams: Promise<{ page?: string; size?: string; q?: string }>;
}

export default async function AdminApplicationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = Number(params.size) || 10;
  const query = params.q || undefined;

  const { data, pagination } = getMockApplicationsPaginated(page, pageSize, query);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Solicitudes</h1>
          <p className="text-sm text-muted-foreground">{pagination.totalItems} solicitudes totales</p>
        </div>
      </div>

      <ApplicationsTableClient data={data} pagination={pagination} />
    </div>
  );
}
