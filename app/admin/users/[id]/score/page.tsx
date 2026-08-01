import { mockUserDetail } from '@/modules/admin';
import { ScoreTab } from '@/components/admin/users/ScoreTab';

// TODO: mockUserDetail no está indexado por userId — mismo dato mock para cualquier usuario
// hasta que este tab se conecte al backend real (ver plan: fuera de alcance de este push).
export default async function AdminUserScorePage() {
  return <ScoreTab score={mockUserDetail.score} />;
}
