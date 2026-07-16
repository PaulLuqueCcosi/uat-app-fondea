import { redirect } from 'next/navigation';

/** Redirige a la nueva ruta /admin/fund */
export default function CapitalRedirect() {
  redirect('/admin/fund');
}
