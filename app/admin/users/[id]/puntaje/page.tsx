import { mockUserDetail } from '@/modules/admin';
import { PuntajeTab } from '@/components/admin/users/PuntajeTab';

// TODO: mockUserDetail no está indexado por userId (ver score/page.tsx) — fuera de alcance de este push.
export default async function AdminUserPuntajePage() {
  return <PuntajeTab gamification={mockUserDetail.gamification} />;
}
