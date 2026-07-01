import { Users } from 'lucide-react';
import { getMockUsersPaginated } from '@/modules/admin';
import { UsersTableClient } from '@/components/admin/users/UsersTableClient';

interface Props {
  searchParams: Promise<{ page?: string; size?: string; q?: string }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = Number(params.size) || 10;
  const query = params.q || undefined;

  // TODO: reemplazar con fetch al backend GET /api/admin/users?page=X&size=Y&q=Z
  const { data, pagination } = getMockUsersPaginated(page, pageSize, query);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Usuarios</h1>
          <p className="text-sm text-muted-foreground">{pagination.totalItems} usuarios registrados</p>
        </div>
      </div>

      {/* Tabla con paginación */}
      <UsersTableClient data={data} pagination={pagination} />
    </div>
  );
}
