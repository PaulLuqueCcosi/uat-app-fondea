import { requireValidSession, performSignOut } from '@/app/actions/auth.actions';
import { getProfileSummary } from '@/modules/profile';
import { AppSidebar } from '@/components/dashboard/AppSidebar';
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar';
import { NotificationSSEProvider } from '@/components/dashboard/NotificationSSEProvider';
import { AppBackground } from '@/components/ui/app-background';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardProvider } from '@/lib/contexts/dashboard-context';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validar sesión (seguridad — redirige si no hay auth)
  await requireValidSession();

  // Solo perfil básico — rápido (1 llamada a Logto)
  const profileResult = await getProfileSummary();
  const summary = profileResult.ok ? profileResult.data : null;

  const user = {
    name: summary?.name || 'Usuario',
    email: summary?.email || '',
    avatar: summary?.avatar || null,
    dni: summary?.dni || null,
    id: summary?.id || null,
  };

  return (
    <DashboardProvider summary={summary}>
      <SidebarProvider>
        <div className="min-h-screen flex flex-col w-full">
          <AppBackground />

          {/* SSE para notificaciones en tiempo real */}
          <NotificationSSEProvider />

          {/* Navbar con SidebarTrigger + breadcrumb integrados */}
          <DashboardNavbar user={user} onSignOut={performSignOut} />

          {/* Sidebar + Contenido */}
          <div className="flex flex-1 overflow-hidden">
            <AppSidebar user={{ name: user.name, avatar: user.avatar }} />
            <SidebarInset>
              {children}
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </DashboardProvider>
  );
}
