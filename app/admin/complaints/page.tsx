import { MessageSquareWarning } from 'lucide-react';
import { getAdminComplaints } from '@/modules/admin/admin-complaints.service';
import { ComplaintsTable } from '@/components/admin/complaints/ComplaintsTable';
import type { ComplaintFilters, ComplaintStatus, ComplaintType } from '@/modules/admin/admin-complaints.types';

interface Props {
  searchParams: Promise<{
    page?: string;
    size?: string;
    status?: string;
    type?: string;
    onlyOverdue?: string;
    sortBy?: string;
    sortDir?: string;
  }>;
}

export default async function AdminComplaintsPage({ searchParams }: Props) {
  const params = await searchParams;

  const page = Number(params.page) || 1;
  const pageSize = Number(params.size) || 20;

  const filters: ComplaintFilters = {
    status: (params.status as ComplaintStatus) ?? undefined,
    type: (params.type as ComplaintType) ?? undefined,
    onlyOverdue: params.onlyOverdue === 'true' ? true : undefined,
    sortBy: (params.sortBy as ComplaintFilters['sortBy']) ?? undefined,
    sortDir: (params.sortDir as ComplaintFilters['sortDir']) ?? undefined,
  };

  const result = await getAdminComplaints(page, pageSize, filters);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <MessageSquareWarning className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Libro de Reclamaciones</h1>
          <p className="text-sm text-muted-foreground">
            Reclamos y quejas activos — plazo legal: 15 días hábiles (Ley 32495)
          </p>
        </div>
      </div>

      <ComplaintsTable data={result.data} pagination={result.pagination} />
    </div>
  );
}
