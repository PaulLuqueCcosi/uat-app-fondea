import { redirect } from 'next/navigation';

export default function FunnelPage() {
  // Redirigir automáticamente al primer paso del funnel
  redirect('/funnel/labor');
}
