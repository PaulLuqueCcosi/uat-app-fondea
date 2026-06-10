import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { getFullUserProfile } from '@/lib/user/get-user-profile';
import { ProfileContent } from '@/components/dashboard/profile/ProfileContent';

export default async function ProfilePage() {
  const data = await getFullUserProfile();

  if (!data) {
    return (
      <>
        <PageHeader
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Mi Perfil' },
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Card>
            <p className="text-sm text-error-700 p-4">No se pudo obtener información del usuario</p>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Mi Perfil' },
        ]}
      />

      <div className="flex flex-1 flex-col gap-6 p-4 max-w-4xl">
        <ProfileContent
          profile={data.profile}
          contact={data.contact}
          security={data.security}
        />
      </div>
    </>
  );
}
