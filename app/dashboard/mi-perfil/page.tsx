'use client';

import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Lock,
  Link2,
  Pencil,
  Shield,
  CheckCircle,
  AlertCircle,
  Globe,
} from 'lucide-react';

// ── Datos mock para visualización ─────────────────────────────────────────────

const mockUser = {
  firstName: 'Carlos',
  secondName: 'Alberto',
  firstLastName: 'Mendoza',
  secondLastName: 'Quispe',
  email: 'carlos.mendoza@gmail.com',
  emailVerified: true,
  phone: '+51 987 654 321',
  phoneVerified: true,
  dni: '72345678',
  avatar: null as string | null,
  hasPassword: true,
  linkedAccounts: [
    { provider: 'google', email: 'carlos.mendoza@gmail.com', connectedAt: '2025-01-15' },
  ],
  createdAt: '2025-01-10T14:30:00Z',
  lastLogin: '2026-06-03T09:15:00Z',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function VerifiedBadge({ verified }: { verified: boolean }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-success-700">
        <CheckCircle className="w-3 h-3" />
        Verificado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-warning-700">
      <AlertCircle className="w-3 h-3" />
      No verificado
    </span>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function MiPerfilPage() {
  const fullName = `${mockUser.firstName} ${mockUser.secondName} ${mockUser.firstLastName} ${mockUser.secondLastName}`;
  const initials = `${mockUser.firstName[0]}${mockUser.firstLastName[0]}`;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Mi Perfil' },
        ]}
      />

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-3xl">

        {/* ── Header del perfil ── */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Avatar className="w-20 h-20 border-2 border-primary/20">
                {mockUser.avatar && <AvatarImage src={mockUser.avatar} alt={fullName} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left space-y-1">
                <h1 className="text-xl font-bold text-foreground">{fullName}</h1>
                <p className="text-sm text-muted-foreground">
                  Miembro desde {new Date(mockUser.createdAt).toLocaleDateString('es-PE', { year: 'numeric', month: 'long' })}
                </p>
                <p className="text-xs text-muted-foreground">
                  Último acceso: {new Date(mockUser.lastLogin).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Correo electrónico ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              Correo electrónico
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{mockUser.email}</p>
                <VerifiedBadge verified={mockUser.emailVerified} />
              </div>
              <Button variant="outline" size="sm" className="shrink-0">
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Cambiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Número de celular ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Número de celular
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{mockUser.phone}</p>
                <VerifiedBadge verified={mockUser.phoneVerified} />
              </div>
              <Button variant="outline" size="sm" className="shrink-0">
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Cambiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── DNI ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Documento de identidad
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">DNI {mockUser.dni}</p>
                <span className="inline-flex items-center gap-1 text-xs text-success-700">
                  <Shield className="w-3 h-3" />
                  Verificado por RENIEC
                </span>
              </div>
              <Badge variant="outline" className="bg-neutral-50 text-neutral-500 border-neutral-200 shrink-0">
                No editable
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              El DNI no se puede cambiar una vez verificado. Contacta a soporte si necesitas actualizar este dato.
            </p>
          </CardContent>
        </Card>

        {/* ── Contraseña ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Contraseña
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                {mockUser.hasPassword ? (
                  <>
                    <p className="text-sm font-medium">••••••••••</p>
                    <p className="text-xs text-muted-foreground">Contraseña configurada</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">No tienes contraseña configurada</p>
                    <p className="text-xs text-muted-foreground">Iniciaste sesión con Google u otro proveedor</p>
                  </>
                )}
              </div>
              <Button variant="outline" size="sm" className="shrink-0">
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                {mockUser.hasPassword ? 'Cambiar' : 'Crear'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Cuentas vinculadas ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              Cuentas vinculadas
            </CardTitle>
            <CardDescription>Proveedores de inicio de sesión conectados</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* Google */}
              {mockUser.linkedAccounts.map((account, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium capitalize">{account.provider}</p>
                      <p className="text-xs text-muted-foreground truncate">{account.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-success-50 text-success-700 border-success-200 shrink-0">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Conectada
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Zona de peligro ── */}
        <Card className="border-error-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-error-700">Zona de peligro</CardTitle>
            <CardDescription>Acciones irreversibles sobre tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Eliminar mi cuenta</p>
                <p className="text-xs text-muted-foreground">
                  Se eliminarán todos tus datos permanentemente. Esta acción no se puede deshacer.
                </p>
              </div>
              <Button variant="destructive" size="sm" className="shrink-0">
                Eliminar cuenta
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </>
  );
}
