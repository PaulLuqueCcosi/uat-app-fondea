import { Suspense } from 'react';
import { getFullUserProfile } from '@/lib/user/get-user-profile';
import { PageTitle } from '@/components/ui/page-title';
import { ProfileContent } from '@/components/dashboard/profile/ProfileContent';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

async function ProfileLoader() {
  const data = await getFullUserProfile();

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm text-error-700">No se pudo obtener información del usuario</p>
        </CardContent>
      </Card>
    );
  }

  return <ProfileContent profile={data.profile} contact={data.contact} security={data.security} />;
}

function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Card><CardContent className="pt-6 pb-6 flex flex-col items-center gap-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-28" />
        </CardContent></Card>
        <Card><CardContent className="pt-4 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-48" />
        </CardContent></Card>
        <Card><CardContent className="pt-4 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-56" />
        </CardContent></Card>
      </div>
      <div className="space-y-4">
        <Card><CardContent className="pt-4 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-40" />
        </CardContent></Card>
        <Card><CardContent className="pt-4 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </CardContent></Card>
      </div>
    </div>
  );
}

export default function MiPerfilPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <PageTitle
        title="Mi Perfil"
        description="Gestiona tus datos personales y la seguridad de tu cuenta."
      />

      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileLoader />
      </Suspense>
    </div>
  );
}
