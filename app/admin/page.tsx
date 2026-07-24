import { redirect } from 'next/navigation';

/**
 * Página raíz del admin.
 * Redirige automáticamente a /admin/analytics (KPIs Globales).
 */
export default function AdminPage() {
  redirect('/admin/analytics');
}
