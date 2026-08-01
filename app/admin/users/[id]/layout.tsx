import { getAdminUserDetail } from '@/modules/admin';
import { UserDetailNav } from '@/components/admin/users/UserDetailNav';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function AdminUserDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAdminUserDetail(id);

  const displayUser = user || {
    id,
    name: '(Usuario no encontrado)',
    firstName: null,
    secondName: null,
    paternalSurname: null,
    maternalSurname: null,
    documentType: null,
    documentNumber: null,
    nationality: null,
    registeredAt: '',
    updatedAt: null,
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      {/* Back */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Usuarios
      </Link>

      {/* Header del usuario */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-base sm:text-lg font-bold text-primary shrink-0">
            {displayUser.name
              .split(' ')
              .slice(0, 2)
              .map((n: string) => n[0])
              .join('')}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
              {displayUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {displayUser.documentType && (
                <>
                  <span className="font-mono">
                    {displayUser.documentType}: {displayUser.documentNumber}
                  </span>{' '}
                  ·{' '}
                </>
              )}
              <span className="font-mono text-xs">{displayUser.id.slice(0, 8)}...</span>
            </p>
          </div>
        </div>
        {displayUser.registeredAt && (
          <p className="text-xs text-muted-foreground shrink-0">
            Registro: {new Date(displayUser.registeredAt).toLocaleDateString('es-PE')}
          </p>
        )}
      </div>

      {/* Tabs de navegación */}
      <UserDetailNav userId={id} />

      {/* Contenido — full width */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
