import { PageTitle } from '@/components/ui/page-title';
import { ApplicationsTable } from '@/components/dashboard/ApplicationsTable';

export const dynamic = 'force-dynamic';

export default function LoansPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <PageTitle
        title="Mis Solicitudes"
        description="Revisa el estado de todas tus solicitudes de préstamo."
      />

      <ApplicationsTable />
    </div>
  );
}
