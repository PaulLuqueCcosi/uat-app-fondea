'use client';

import { useState } from 'react';
import {
  Shield,
  Briefcase,
  DollarSign,
  MapPin,
  Users,
  Building2,
  Pencil,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { Separator } from '@/components/ui/separator';

import { FunnelKYCValidation } from '@/components/forms/solicitar/KYCValidation';
import { FunnelLaborProfileShadcn } from '@/components/forms/solicitar/LaborProfileShadcn';
import { FunnelEconomicProfileShadcn } from '@/components/forms/solicitar/EconomicProfileShadcn';
import { FunnelAddressShadcn } from '@/components/forms/solicitar/AddressShadcn';
import { FunnelReferencesShadcn } from '@/components/forms/solicitar/ReferencesShadcn';
import { FunnelBankAccountShadcn } from '@/components/forms/solicitar/BankAccountShadcn';

import type { KYCData } from '@/lib/types';
import type {
  LaborProfileStatus,
  EconomicProfileStatus,
  ReferencesProfileStatus,
  AddressProfileStatus,
  BankAccountProfileStatus,
} from '@/lib/types';

// ── Types ─────────────────────────────────────────────────────────────────────

type SectionId = 'kyc' | 'labor' | 'economic' | 'address' | 'references' | 'bank-account';

interface MiExpedienteClientProps {
  kycData: KYCData | null;
  kycBlocked: boolean;
  kycBlockedHoursLeft: number;
  kycAttemptsLeft: number;
  laborData: LaborProfileStatus;
  economicData: EconomicProfileStatus;
  referencesData: ReferencesProfileStatus;
  addressData: AddressProfileStatus;
  bankAccountData: BankAccountProfileStatus;
  ubigeoNames: { region: string; province: string; district: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ verified }: { verified: boolean }) {
  if (verified) {
    return (
      <Badge variant="outline" className="bg-success-50 text-success-700 border-success-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Verificado
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-warning-50 text-warning-700 border-warning-200">
      <Clock className="w-3 h-3 mr-1" />
      Pendiente
    </Badge>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="py-1.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || '—'}</p>
    </div>
  );
}

function formatCurrency(amount: number | string | undefined): string {
  if (!amount) return '—';
  const num = typeof amount === 'string' ? Number(amount) : amount;
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0 }).format(num);
}

// ── Componente principal ──────────────────────────────────────────────────────

export function MiExpedienteClient({
  kycData,
  kycBlocked,
  kycBlockedHoursLeft,
  kycAttemptsLeft,
  laborData,
  economicData,
  referencesData,
  addressData,
  bankAccountData,
  ubigeoNames,
}: MiExpedienteClientProps) {
  const [editingSection, setEditingSection] = useState<SectionId | null>(null);

  const isEditing = (section: SectionId) => editingSection === section;

  const handleEdit = (section: SectionId) => {
    setEditingSection(section);
  };

  const handleClose = () => {
    setEditingSection(null);
  };

  // ── Si hay una sección en edición, mostrar el formulario full-width ──
  if (editingSection) {
    return (
      <div className="flex flex-col gap-6">
        {/* Botón volver */}
        <button
          onClick={handleClose}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <X className="w-4 h-4" />
          Volver a Mi Expediente
        </button>

        {/* Formulario con el mismo wrapper que /solicitar/* */}
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
          {editingSection === 'kyc' && (
            <FunnelKYCValidation
              dashboardMode
              initialData={kycData}
              initialBlocked={kycBlocked}
              initialBlockedHoursLeft={kycBlockedHoursLeft}
              initialAttemptsLeft={kycAttemptsLeft}
            />
          )}
          {editingSection === 'labor' && (
            <FunnelLaborProfileShadcn dashboardMode initialData={laborData} />
          )}
          {editingSection === 'economic' && (
            <FunnelEconomicProfileShadcn dashboardMode initialData={economicData} />
          )}
          {editingSection === 'address' && (
            <FunnelAddressShadcn dashboardMode initialData={addressData} />
          )}
          {editingSection === 'references' && (
            <FunnelReferencesShadcn dashboardMode initialData={referencesData} />
          )}
          {editingSection === 'bank-account' && (
            <FunnelBankAccountShadcn dashboardMode initialData={bankAccountData} />
          )}
        </div>

        {/* Botón cancelar */}
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <Button variant="outline" className="w-full" onClick={handleClose}>
            Cancelar y volver
          </Button>
        </div>
      </div>
    );
  }

  // ── Vista readonly — grid de secciones ──
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageTitle
        title="Mi Expediente"
        description="Toda tu información personal verificada. Toca &quot;Editar&quot; para modificar una sección."
      />

      {/* Grid de secciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Identidad (KYC) ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Identidad
            </CardTitle>
            <CardDescription>Verificación de identidad con DNI</CardDescription>
            <CardAction>
              <div className="flex items-center gap-2">
                <StatusBadge verified={kycData?.status === 'VERIFIED'} />
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleEdit('kyc')}>
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </Button>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            {kycData ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <InfoRow label="DNI" value={kycData.dni} />
                <InfoRow label="Código verificación" value={kycData.verificationCode} />
                <InfoRow label="Nombres" value={`${kycData.firstName} ${kycData.secondName}`.trim()} />
                <InfoRow label="Apellidos" value={`${kycData.firstLastName} ${kycData.secondLastName}`.trim()} />
                <InfoRow label="Fecha de nacimiento" value={kycData.birth_date} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos registrados</p>
            )}
          </CardContent>
        </Card>

        {/* ── Situación Laboral ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Situación Laboral
            </CardTitle>
            <CardDescription>Empleo, ingresos y sector</CardDescription>
            <CardAction>
              <div className="flex items-center gap-2">
                <StatusBadge verified={laborData.overall_verified} />
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleEdit('labor')}>
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </Button>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            {laborData.situation ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <InfoRow label="Situación" value={laborData.situation.employment_status} />
                <InfoRow label="Sector" value={laborData.details?.industry} />
                <InfoRow label="Antigüedad" value={laborData.details?.years_of_activity != null ? `${laborData.details.years_of_activity} años` : undefined} />
                <InfoRow label="Ingreso mensual" value={formatCurrency(laborData.income?.monthly_income)} />
                <InfoRow label="Forma de cobro" value={laborData.income?.income_receipt_method} />
                {laborData.details?.business_ruc && <InfoRow label="RUC" value={laborData.details.business_ruc} />}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos registrados</p>
            )}
          </CardContent>
        </Card>

        {/* ── Perfil Económico ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Perfil Económico
            </CardTitle>
            <CardDescription>Gastos, deudas y patrimonio</CardDescription>
            <CardAction>
              <div className="flex items-center gap-2">
                <StatusBadge verified={economicData.overall_verified} />
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleEdit('economic')}>
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </Button>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            {economicData.profile ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <InfoRow label="Propósito del préstamo" value={economicData.profile.loan_purpose} />
                <InfoRow label="Gastos mensuales" value={formatCurrency(economicData.profile.monthly_expenses)} />
                <InfoRow label="Tiene deudas" value={economicData.profile.has_debts ? 'Sí' : 'No'} />
                <InfoRow label="Nivel educativo" value={economicData.profile.education_level} />
                <InfoRow label="Propiedad" value={economicData.profile.has_property ? 'Sí' : 'No'} />
                <InfoRow label="Vehículo" value={economicData.profile.has_vehicle ? 'Sí' : 'No'} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos registrados</p>
            )}
          </CardContent>
        </Card>

        {/* ── Dirección ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Dirección
            </CardTitle>
            <CardDescription>Domicilio actual</CardDescription>
            <CardAction>
              <div className="flex items-center gap-2">
                <StatusBadge verified={addressData.overall_verified} />
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleEdit('address')}>
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </Button>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            {addressData.profile ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <InfoRow label="Departamento" value={ubigeoNames.region} />
                <InfoRow label="Provincia" value={ubigeoNames.province} />
                <InfoRow label="Distrito" value={ubigeoNames.district} />
                <InfoRow
                  label="Dirección"
                  value={addressData.profile.google_address || addressData.profile.street_address}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos registrados</p>
            )}
          </CardContent>
        </Card>

        {/* ── Referencias ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Referencias
            </CardTitle>
            <CardDescription>Contactos de referencia personal</CardDescription>
            <CardAction>
              <div className="flex items-center gap-2">
                <StatusBadge verified={referencesData.overall_verified} />
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleEdit('references')}>
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </Button>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            {referencesData.profile ? (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Familiar</p>
                  <p className="text-sm font-medium">{referencesData.profile.family_reference.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {referencesData.profile.family_reference.relationship} · {referencesData.profile.family_reference.phone}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">No familiar</p>
                  <p className="text-sm font-medium">{referencesData.profile.non_family_reference.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {referencesData.profile.non_family_reference.relationship} · {referencesData.profile.non_family_reference.phone}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos registrados</p>
            )}
          </CardContent>
        </Card>

        {/* ── Cuenta Bancaria ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Cuenta Bancaria
            </CardTitle>
            <CardDescription>Cuenta para desembolso</CardDescription>
            <CardAction>
              <div className="flex items-center gap-2">
                <StatusBadge verified={bankAccountData.overall_verified} />
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleEdit('bank-account')}>
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </Button>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            {bankAccountData.profile ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <InfoRow label="Banco" value={bankAccountData.profile.bank_name} />
                <InfoRow label="Tipo de cuenta" value={bankAccountData.profile.account_type} />
                <InfoRow label="Número de cuenta" value={bankAccountData.profile.account_number} />
                <InfoRow label="CCI" value={bankAccountData.profile.cci} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos registrados</p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
