import { getAdminUserDetail, getAdminUserAuth } from '@/modules/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataRow } from '@/components/ui/data-row';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { KeyRound, Link2, User as UserIcon } from 'lucide-react';
import { formatDateTime } from '@/components/admin/users/score-format';

const PROVIDER_LABEL: Record<string, string> = {
  google: 'Google',
  facebook: 'Facebook',
  apple: 'Apple',
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, auth] = await Promise.all([getAdminUserDetail(id), getAdminUserAuth(id)]);

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
            <DataRow label="Nombres adicionales" value={user.additionalNames} />
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
          <CardTitle className="text-sm flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            Autenticación
            {auth && (
              <Badge variant={auth.isSuspended ? 'error' : 'success'} className="ml-auto">
                {auth.isSuspended ? 'Suspendida' : 'Activa'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auth ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  {auth.avatarUrl && <AvatarImage src={auth.avatarUrl} alt={user.name} />}
                  <AvatarFallback>
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground">
                  {auth.avatarUrl ? 'Foto de perfil del proveedor de identidad' : 'Sin foto de perfil configurada'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DataRow label="Email" value={auth.email} />
                <DataRow label="Teléfono" value={auth.phone} />
                <DataRow label="Contraseña configurada" value={auth.hasPassword} />
                <DataRow
                  label="Último inicio de sesión"
                  value={auth.lastSignInAt ? formatDateTime(auth.lastSignInAt) : null}
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Cuentas vinculadas</p>
                {auth.identities.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    Ninguna — este usuario solo inicia sesión con contraseña.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {auth.identities.map((identity) => (
                      <div key={identity.provider} className="rounded-lg border p-3 flex items-center gap-3">
                        <Link2 className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <span className="text-sm font-medium">
                            {PROVIDER_LABEL[identity.provider] ?? identity.provider}
                          </span>
                          {identity.email && (
                            <span className="text-xs text-muted-foreground ml-2">{identity.email}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No se pudo obtener la información de autenticación del proveedor de identidad.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Registro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DataRow label="ID interno" value={user.id} mono />
            <DataRow label="ID en Logto" value={user.logtoId} mono />
            <DataRow label="Ya desembolsó su primer crédito" value={user.hasDisbursedLoan} />
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
