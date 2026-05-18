import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { getLogtoContext } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';
import { User, Mail, Phone, Calendar, Shield, Key, Server } from 'lucide-react';
import { ProfileClient } from '@/components/dashboard/ProfileClient';

export default async function ProfilePage() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated || !claims) {
    return (
      <>
        <PageHeader
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Mi Perfil' },
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Card>
            <p className="text-sm text-error">No se pudo obtener información del usuario</p>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Mi Perfil' },
        ]}
      />

      <div className="flex flex-1 flex-col gap-6 p-4 max-w-4xl">
        {/* Demo: Datos desde API Route (Client Component) */}
        <ProfileClient />

        {/* Información Principal (Server Component) */}
        <Card>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              Datos desde Server Component
            </h2>
            <p className="text-xs text-fondea-text">
              Estos datos se obtienen directamente en el servidor con getLogtoContext()
            </p>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Información Personal
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-fondea-text font-medium">Nombre completo</p>
                <p className="text-sm text-dark font-medium">
                  {claims.name || claims.username || 'No disponible'}
                </p>
              </div>

              {claims.email && (
                <div className="space-y-1">
                  <p className="text-xs text-fondea-text font-medium flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Correo electrónico
                  </p>
                  <p className="text-sm text-dark">{claims.email}</p>
                  {claims.email_verified && (
                    <p className="text-xs text-success-600 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Verificado
                    </p>
                  )}
                </div>
              )}

              {claims.phone_number && (
                <div className="space-y-1">
                  <p className="text-xs text-fondea-text font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Teléfono
                  </p>
                  <p className="text-sm text-dark">{claims.phone_number}</p>
                  {claims.phone_number_verified && (
                    <p className="text-xs text-success-600 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Verificado
                    </p>
                  )}
                </div>
              )}

              {claims.picture && (
                <div className="space-y-1">
                  <p className="text-xs text-fondea-text font-medium">Foto de perfil</p>
                  <img
                    src={claims.picture}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Información de Cuenta
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-fondea-text font-medium">ID de Usuario</p>
                <p className="text-sm text-dark font-mono">{claims.sub}</p>
              </div>

              {claims.updated_at ? (
                <div className="space-y-1">
                  <p className="text-xs text-fondea-text font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Última actualización
                  </p>
                  <p className="text-sm text-dark">
                    {new Date(Number(claims.updated_at) * 1000).toLocaleDateString('es-PE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
