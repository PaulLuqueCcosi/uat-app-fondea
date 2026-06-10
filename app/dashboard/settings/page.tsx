import { Suspense } from 'react';
import { getUserSecurity } from '@/lib/user/get-user-profile';
import { PageTitle } from '@/components/ui/page-title';
import { SettingsContent } from '@/components/dashboard/settings/SettingsContent';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

async function SettingsLoader() {
  const security = await getUserSecurity();
  return <SettingsContent security={security} />;
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Card><CardContent className="pt-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent></Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <PageTitle
        title="Configuración"
        description="Gestiona la seguridad de tu cuenta y tus conexiones."
      />

      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsLoader />
      </Suspense>
    </div>
  );
}
