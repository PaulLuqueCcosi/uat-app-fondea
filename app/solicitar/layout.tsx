import { requireValidSession, performSignOut } from '@/app/actions/auth.actions';
import { getProfileSummary } from '@/modules/profile';
import { AppBackground } from '@/components/ui/app-background';
import { FunnelLayoutClient } from '@/components/solicitar/SolicitarLayoutClient';

export default async function FunnelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireValidSession();

  const profileResult = await getProfileSummary();
  const summary = profileResult.ok ? profileResult.data : null;

  const user = {
    id: summary?.id || '',
    name: summary?.name || 'Usuario',
    email: summary?.email || '',
    avatar: summary?.avatar || null,
    dni: summary?.dni || undefined,
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <AppBackground />

      <FunnelLayoutClient
        user={user}
        onSignOut={performSignOut}
      >
        {children}
      </FunnelLayoutClient>
    </div>
  );
}
