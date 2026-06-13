import { requireValidSession, performSignOut } from '@/app/actions/auth.actions';
import { isExpedienteComplete } from '@/app/actions/expediente-summary.actions';
import { getUserInfo } from '@/modules/profile';
import { getUserSupportData } from '@/modules/profile';
import { AppSidebar } from '@/components/dashboard/AppSidebar';
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar';
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
  // Validar sesión (seguridad — redirige si no hay auth)
  await requireValidSession();

  // Obtener datos del usuario desde Logto
  const [userInfo, profileComplete, supportData] = await Promise.all([
    getUserInfo(),
    isExpedienteComplete(),
    getUserSupportData(),
  ]);

  const user = {
    name: userInfo.name || 'Usuario',
    email: userInfo.email || '',
    dni: supportData.dni,
    id: supportData.accountId,
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        <AppBackground />

        {/* Navbar con SidebarTrigger + breadcrumb integrados */}
        <DashboardNavbar user={user} onSignOut={performSignOut} />

        {/* Sidebar + Contenido */}
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar profileComplete={profileComplete} />
          <SidebarInset>
            {children}
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
