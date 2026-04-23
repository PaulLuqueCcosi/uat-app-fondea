import { getLogtoContext, signOut } from '@logto/next/server-actions';
import { redirect } from 'next/navigation';
import { logtoConfig } from '../logto';
import { FunnelNavbar } from '../../components/funnel/FunnelNavbar';
import { FunnelSidebar } from '../../components/funnel/FunnelSidebar';
import { appBackgroundStyle, blobTopRight, blobBottomLeft } from '@/lib/backgroundStyle';

export default async function FunnelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated) {
    redirect('/');
  }

  const user = {
    id: claims?.sub || '',
    name: claims?.name || claims?.username || 'Usuario',
    email: claims?.email || '',
    phone: claims?.phone_number || '',
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background */}
      <div className="fixed inset-0 -z-10" style={appBackgroundStyle} />
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full" style={blobTopRight} />
        <div className="absolute -bottom-64 -left-32 w-[550px] h-[550px] rounded-full" style={blobBottomLeft} />
      </div>

      <FunnelNavbar
        user={user}
        onSignOut={async () => {
          'use server';
          await signOut(logtoConfig);
        }}
      />

      <div className="flex flex-1">
        <FunnelSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 md:ml-80">
          {children}
        </main>
      </div>
    </div>
  );
}
