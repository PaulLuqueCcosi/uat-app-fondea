import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

export default function LoansPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Mis Solicitudes' },
        ]}
      />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <Card>
          <p className="text-sm text-fondea-text">
            Página de solicitudes - Por implementar
          </p>
        </Card>
      </div>
    </>
  );
}
