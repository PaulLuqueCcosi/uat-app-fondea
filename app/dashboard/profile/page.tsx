import { Card } from '@/app/components/ui/Card';
import { getLogtoContext } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';
import { User, Mail, Phone, Calendar, Shield, Key, Server } from 'lucide-react';
import { ProfileClient } from '@/app/components/dashboard/ProfileClient';

export default async function ProfilePage() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated || !claims) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <p className="text-sm text-error">No se pudo obtener información del usuario</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark mb-2">Mi Perfil</h1>
        <p className="text-fondea-text">Información de tu cuenta y datos personales</p>
      </div>

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
                  <p className="text-xs text-green-600 flex items-center gap-1">
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
                  <p className="text-xs text-green-600 flex items-center gap-1">
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

      {/* Información de Cuenta */}
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

            {claims.aud && (
              <div className="space-y-1">
                <p className="text-xs text-fondea-text font-medium">Audience</p>
                <p className="text-sm text-dark font-mono text-xs">{claims.aud}</p>
              </div>
            )}

            {claims.iss && (
              <div className="space-y-1">
                <p className="text-xs text-fondea-text font-medium">Issuer</p>
                <p className="text-sm text-dark font-mono text-xs">{claims.iss}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Todos los Claims (Debug) */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-dark">
            Todos los Claims (Debug)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-fondea-text font-medium">Claim</th>
                  <th className="text-left py-2 px-3 text-fondea-text font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(claims).map(([key, value]) => (
                  <tr key={key} className="border-b border-border/50">
                    <td className="py-2 px-3 text-dark font-mono text-xs">{key}</td>
                    <td className="py-2 px-3 text-fondea-text font-mono text-xs break-all">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
