import { getAdminUserDetail } from '@/modules/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataRow } from '@/components/ui/data-row';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAdminUserDetail(id);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          No se encontró el usuario.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Información personal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DataRow label="Primer nombre" value={user.firstName} />
            <DataRow label="Segundo nombre" value={user.secondName} />
            <DataRow label="Apellido paterno" value={user.paternalSurname} />
            <DataRow label="Apellido materno" value={user.maternalSurname} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Identificación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DataRow label="Tipo de documento" value={user.documentType} />
            <DataRow label="Número de documento" value={user.documentNumber} mono />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Registro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DataRow label="ID interno" value={user.id} mono />
            <DataRow
              label="Fecha de registro"
              value={
                user.registeredAt
                  ? new Date(user.registeredAt).toLocaleDateString('es-PE', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : null
              }
            />
            <DataRow
              label="Última actualización"
              value={
                user.updatedAt
                  ? new Date(user.updatedAt).toLocaleDateString('es-PE', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : null
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
