import { getUser } from '@/app/actions/auth.actions';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar';
import { appBackgroundStyle, blobTopRight, blobBottomLeft } from '@/lib/backgroundStyle';
import { signOut } from '@logto/next/server-actions';
import { logtoConfig } from '../logto';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background */}
      <div className="fixed inset-0 -z-10" style={appBackgroundStyle} />
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full" style={blobTopRight} />
        <div className="absolute -bottom-64 -left-32 w-[550px] h-[550px] rounded-full" style={blobBottomLeft} />
      </div>

      <DashboardNavbar
        user={user}
        onSignOut={async () => {
          'use server';
          await signOut(logtoConfig);
        }}
      />

      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 pt-20">
          {children}
        </main>
      </div>
    </div>
  );
}
