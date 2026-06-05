'use client';

import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Briefcase,
  DollarSign,
  MapPin,
  Users,
  Building2,
  Calendar,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

// ── Datos mock para visualización ─────────────────────────────────────────────

const mockUser = {
  firstName: 'Carlos',
  secondName: 'Alberto',
  firstLastName: 'Mendoza',
  secondLastName: 'Quispe',
  email: 'carlos.mendoza@gmail.com',
  phone: '+51 987 654 321',
  dni: '72345678',
  birthDate: '1992-03-15',
  avatar: null as string | null,
};

const mockKyc = {
  status: 'VERIFIED' as const,
  dni: '72345678',
  verificationCode: '3',
};

const mockLabor = {
  status: 'VERIFIED' as const,
  employmentStatus: 'EMPLEADO_DEPENDIENTE',
  industry: 'TECNOLOGIA',
  yearsOfActivity: 4,
  monthlyIncome: 5500,
  incomeReceiptMethod: 'CUENTA_BANCARIA',
  hasAdditionalIncome: true,
  additionalIncomes: [
    { type: 'FREELANCE', amount: 1200 },
  ],
};

const mockEconomic = {
  status: 'VERIFIED' as const,
  loanPurpose: 'CONSOLIDACION_DEUDA',
  monthlyExpenses: 2800,
  hasDebts: true,
  debts: [
    { entity: 'BCP', type: 'Tarjeta de crédito', monthlyPayment: 450 },
    { entity: 'Interbank', type: 'Préstamo personal', monthlyPayment: 320 },
  ],
  hasProperty: true,
  hasVehicle: false,
  educationLevel: 'UNIVERSITARIO_COMPLETO',
};

const mockReferences = {
  status: 'VERIFIED' as const,
  references: [
    { name: 'María López', relationship: 'Familiar', phone: '+51 998 765 432' },
    { name: 'Jorge Ramírez', relationship: 'Colega', phone: '+51 912 345 678' },
  ],
};

const mockAddress = {
  status: 'PENDING' as const,
  department: 'Lima',
  province: 'Lima',
  district: 'Miraflores',
  address: 'Av. Larco 1250, Dpto 403',
  yearsAtAddress: 3,
};

const mockBankAccount = {
  status: 'VERIFIED' as const,
  bankName: 'BCP',
  accountNumber: '****7823',
  cci: '****0045',
  accountType: 'Ahorros',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'VERIFIED':
      return (
        <Badge variant="outline" className="bg-success-50 text-success-700 border-success-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verificado
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge variant="outline" className="bg-warning-50 text-warning-700 border-warning-200">
          <Clock className="w-3 h-3 mr-1" />
          Pendiente
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-neutral-100 text-neutral-600 border-neutral-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          {status}
        </Badge>
      );
  }
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
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
          { label: 'Mi Expediente' },
        ]}
      />

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-5xl">

        {/* ── Header del perfil ── */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <Avatar className="w-20 h-20 border-2 border-primary/20">
                {mockUser.avatar && <AvatarImage src={mockUser.avatar} alt={fullName} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left space-y-1">
                <h1 className="text-xl font-bold text-foreground">{fullName}</h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {mockUser.email}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {mockUser.phone}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <Badge variant="outline" className="text-xs">
                    <CreditCard className="w-3 h-3 mr-1" />
                    DNI {mockUser.dni}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(mockUser.birthDate).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </Badge>
                </div>
              </div>
              <div className="shrink-0">
                <StatusBadge status={mockKyc.status} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Grid de secciones ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Identidad (KYC) ── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Identidad
                </CardTitle>
                <StatusBadge status={mockKyc.status} />
              </div>
              <CardDescription>Verificación de identidad con DNI</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <InfoRow label="DNI" value={mockKyc.dni} icon={CreditCard} />
                <InfoRow label="Código de verificación" value={mockKyc.verificationCode} />
                <InfoRow label="Nombre" value={`${mockUser.firstName} ${mockUser.secondName}`} icon={User} />
                <InfoRow label="Apellidos" value={`${mockUser.firstLastName} ${mockUser.secondLastName}`} />
              </div>
            </CardContent>
          </Card>

          {/* ── Situación Laboral ── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  Situación Laboral
                </CardTitle>
                <StatusBadge status={mockLabor.status} />
              </div>
              <CardDescription>Datos de empleo e ingresos</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <InfoRow label="Tipo de empleo" value="Empleado dependiente" icon={Briefcase} />
                <InfoRow label="Industria" value="Tecnología" icon={Building2} />
                <InfoRow label="Antigüedad" value={`${mockLabor.yearsOfActivity} años`} icon={Calendar} />
                <InfoRow label="Ingreso mensual" value={`S/ ${mockLabor.monthlyIncome.toLocaleString()}`} icon={DollarSign} />
              </div>
              {mockLabor.hasAdditionalIncome && (
                <>
                  <Separator className="my-3" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Ingresos adicionales</p>
                    {mockLabor.additionalIncomes.map((inc, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-1">
                        <span className="text-muted-foreground">{inc.type === 'FREELANCE' ? 'Freelance' : inc.type}</span>
                        <span className="font-medium">S/ {inc.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Perfil Económico ── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Perfil Económico
                </CardTitle>
                <StatusBadge status={mockEconomic.status} />
              </div>
              <CardDescription>Gastos, deudas y patrimonio</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <InfoRow label="Gastos mensuales" value={`S/ ${mockEconomic.monthlyExpenses.toLocaleString()}`} icon={DollarSign} />
                <InfoRow label="Propósito del préstamo" value="Consolidación de deuda" />
                <InfoRow label="Nivel educativo" value="Universitario completo" />
                <InfoRow label="Propiedad" value={mockEconomic.hasProperty ? 'Sí' : 'No'} />
              </div>
              {mockEconomic.hasDebts && (
                <>
                  <Separator className="my-3" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Deudas actuales</p>
                    {mockEconomic.debts.map((debt, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-1">
                        <span className="text-muted-foreground">{debt.entity} — {debt.type}</span>
                        <span className="font-medium">S/ {debt.monthlyPayment}/mes</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Referencias ── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Referencias
                </CardTitle>
                <StatusBadge status={mockReferences.status} />
              </div>
              <CardDescription>Contactos de referencia personal</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {mockReferences.references.map((ref, i) => (
                  <div key={i} className="flex items-start gap-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{ref.name}</p>
                      <p className="text-xs text-muted-foreground">{ref.relationship} • {ref.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Dirección ── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Dirección
                </CardTitle>
                <StatusBadge status={mockAddress.status} />
              </div>
              <CardDescription>Domicilio actual</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <InfoRow label="Departamento" value={mockAddress.department} icon={MapPin} />
                <InfoRow label="Provincia / Distrito" value={`${mockAddress.province} / ${mockAddress.district}`} />
                <InfoRow label="Dirección" value={mockAddress.address} />
                <InfoRow label="Tiempo en la dirección" value={`${mockAddress.yearsAtAddress} años`} icon={Calendar} />
              </div>
            </CardContent>
          </Card>

          {/* ── Cuenta Bancaria ── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Cuenta Bancaria
                </CardTitle>
                <StatusBadge status={mockBankAccount.status} />
              </div>
              <CardDescription>Cuenta para desembolso</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <InfoRow label="Banco" value={mockBankAccount.bankName} icon={Building2} />
                <InfoRow label="Tipo de cuenta" value={mockBankAccount.accountType} />
                <InfoRow label="Número de cuenta" value={mockBankAccount.accountNumber} icon={CreditCard} />
                <InfoRow label="CCI" value={mockBankAccount.cci} />
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  );
}
