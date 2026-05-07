import { requireValidSession, performSignOut } from '@/app/actions/auth.actions';
import { AppBackground } from '@/components/ui/app-background';
import { FunnelLayoutClient } from '@/components/solicitar/SolicitarLayoutClient';

export default async function FunnelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireValidSession();

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
