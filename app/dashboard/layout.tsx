import { requireValidSession, performSignOut } from '@/app/actions/auth.actions';
import { isExpedienteComplete } from '@/app/actions/expediente-summary.actions';
import { getUserInfo } from '@/lib/user/get-user-name';
import { AppSidebar } from '@/components/dashboard/AppSidebar';
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar';
import { WhatsAppButton } from '@/components/dashboard/WhatsAppButton';
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
  const [userInfo, profileComplete] = await Promise.all([
    getUserInfo(),
    isExpedienteComplete(),
  ]);

  const user = {
    name: userInfo.name || 'Usuario',
    email: userInfo.email || '',
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

        {/* Botón flotante de WhatsApp — Soporte */}
        <WhatsAppButton />
      </div>
    </SidebarProvider>
  );
}
