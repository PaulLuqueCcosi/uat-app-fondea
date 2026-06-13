import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { getFullProfile } from '@/modules/profile';
import { ProfileContent } from '@/components/profile/ProfileContent';

export default async function ProfilePage() {
  const result = await getFullProfile();

  if (!result.ok) {
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
            <p className="text-sm text-error-700 p-4">{result.error.message}</p>
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
          profile={result.data.profile}
          contact={result.data.contact}
          security={result.data.security}
        />
      </div>
    </>
  );
}
