import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Configuración' },
        ]}
      />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <Card>
          <p className="text-sm text-fondea-text">
            Página de configuración - Por implementar
          </p>
        </Card>
      </div>
    </>
  );
}
