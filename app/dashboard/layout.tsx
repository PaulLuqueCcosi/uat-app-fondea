import { requireValidSession, performSignOut } from '@/app/actions/auth.actions';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { AppNavbar } from '@/components/ui/app-navbar';
import { appBackgroundStyle, blobTopRight, blobBottomLeft } from '@/lib/backgroundStyle';

// Forzar renderizado dinámico - NO cache para validación de sesión en tiempo real
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Usar validación normal (con cache inteligente)
  // Solo valida contra servidor cada 5 minutos
  const user = await requireValidSession();

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background */}
      <div className="fixed inset-0 -z-10" style={appBackgroundStyle} />
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full" style={blobTopRight} />
        <div className="absolute -bottom-64 -left-32 w-[550px] h-[550px] rounded-full" style={blobBottomLeft} />
      </div>

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
