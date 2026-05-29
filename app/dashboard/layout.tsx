import { requireValidSession, performSignOut } from '@/app/actions/auth.actions';
import { isExpedienteComplete } from '@/app/actions/expediente-summary.actions';
import { AppSidebar } from '@/components/dashboard/AppSidebar';
import { AppNavbar } from '@/components/ui/app-navbar';
import { AppBackground } from '@/components/ui/app-background';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

// Forzar renderizado dinámico - NO cache para validación de sesión en tiempo real
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireValidSession();
  const profileComplete = await isExpedienteComplete();

  return (
    <div className="min-h-screen flex flex-col">
      <AppBackground />

      {/* ── Navbar — sticky, transversal a todo ── */}
      <AppNavbar
        user={user}
        onSignOut={performSignOut}
      />

      {/* ── Debajo del navbar: sidebar + contenido ── */}
      <div className="flex flex-1 overflow-hidden">
        <SidebarProvider className="min-h-0">
          <AppSidebar profileComplete={profileComplete} />
          <SidebarInset>
            {children}
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
