import { requireValidSession, performSignOut } from '@/app/actions/auth.actions';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { AppNavbar } from '@/components/ui/app-navbar';
import { AppBackground } from '@/components/ui/app-background';

// Forzar renderizado dinámico - NO cache para validación de sesión en tiempo real
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireValidSession();

  return (
    <div className="min-h-screen flex flex-col relative">
      <AppBackground />

      <AppNavbar
        user={user}
        onSignOut={performSignOut}
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
