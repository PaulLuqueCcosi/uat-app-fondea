import { UserMinus } from 'lucide-react';
import { getAdminChurnRisk } from '@/modules/admin/admin-customers.service';
import { ChurnRiskTable } from '@/components/admin/customers/ChurnRiskTable';
import type { ChurnRiskFilters } from '@/modules/admin/admin-customers.types';

interface Props {
  searchParams: Promise<{
    page?: string;
    size?: string;
    minDays?: string;
    maxDays?: string;
  }>;
}

export default async function AdminChurnRiskPage({ searchParams }: Props) {
  const params = await searchParams;

  const page = Number(params.page) || 1;
  const pageSize = Number(params.size) || 20;

  const filters: ChurnRiskFilters = {
    minDaysInactive: params.minDays ? Number(params.minDays) : 30,
    maxDaysInactive: params.maxDays ? Number(params.maxDays) : 60,
  };

  const result = await getAdminChurnRisk(page, pageSize, filters);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
          <UserMinus className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Riesgo de Churn</h1>
          <p className="text-sm text-muted-foreground">
            Clientes inactivos con buen historial — candidatos a reactivación
          </p>
        </div>
      </div>

      <ChurnRiskTable data={result.data} pagination={result.pagination} />
    </div>
  );
}
