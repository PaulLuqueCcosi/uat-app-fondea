import { requireValidSession, performSignOut } from '@/app/actions/auth.actions';
import { appBackgroundStyle, blobTopRight, blobBottomLeft } from '@/lib/backgroundStyle';
import { FunnelLayoutClient } from '@/components/solicitar/SolicitarLayoutClient';

export default async function FunnelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireValidSession();

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background */}
      <div className="fixed inset-0 -z-10" style={appBackgroundStyle} />
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full" style={blobTopRight} />
        <div className="absolute -bottom-64 -left-32 w-[550px] h-[550px] rounded-full" style={blobBottomLeft} />
      </div>

      <FunnelLayoutClient
        user={user}
        onSignOut={performSignOut}
      >
        {children}
      </FunnelLayoutClient>
    </div>
  );
}
