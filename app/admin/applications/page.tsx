import { FileText } from 'lucide-react';
import { getAdminApplications } from '@/modules/admin/admin-applications.service';
import { ApplicationsTableClient } from '@/components/admin/applications/ApplicationsTableClient';

interface Props {
  searchParams: Promise<{
    page?: string;
    size?: string;
    q?: string;
    status?: string;
    submitted_from?: string;
    submitted_to?: string;
    score_min?: string;
    score_max?: string;
  }>;
}

export default async function AdminApplicationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = Number(params.size) || 10;

  const { data, pagination } = await getAdminApplications(page, pageSize, {
    search: params.q,
    status: params.status as any,
    submittedFrom: params.submitted_from,
    submittedTo: params.submitted_to,
    scoreMin: params.score_min ? Number(params.score_min) : undefined,
    scoreMax: params.score_max ? Number(params.score_max) : undefined,
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Solicitudes</h1>
          <p className="text-sm text-muted-foreground">{pagination.totalItems} solicitudes registradas</p>
        </div>
      </div>

      {/* Tabla con paginación */}
      <ApplicationsTableClient data={data} pagination={pagination} />
    </div>
  );
}
