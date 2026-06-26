import { requireAdminRole, performSignOut } from '@/app/actions/auth.actions';
import { getProfileSummary } from '@/modules/profile';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { AppBackground } from '@/components/ui/app-background';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validar sesión + rol admin (redirige a /dashboard si no es admin)
  await requireAdminRole();

  const profileResult = await getProfileSummary();
  const summary = profileResult.ok ? profileResult.data : null;

  const user = {
    name: summary?.name || 'Admin',
    email: summary?.email || '',
    avatar: summary?.avatar || null,
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        <AppBackground />

        <AdminNavbar user={user} onSignOut={performSignOut} />

        <div className="flex flex-1 overflow-hidden">
          <AdminSidebar user={{ name: user.name, avatar: user.avatar }} />
          <SidebarInset>
            {children}
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
