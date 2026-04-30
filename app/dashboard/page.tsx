import { requireValidSession } from '@/app/actions/auth.actions';
import { DashboardHomeClient } from '@/components/dashboard/DashboardHomeClient';

// Forzar renderizado dinámico - NO cache para validación de sesión en tiempo real
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  // ✅ VALIDACIÓN ROBUSTA: Verifica sesión contra Logto en cada carga
  // Esto detecta sesiones revocadas por administrador, tokens expirados, etc.
  const user = await requireValidSession();

  return <DashboardHomeClient userName={user?.name || 'Usuario'} />;
}
