'use client';

import { useState } from 'react';
import {
  Shield,
  Briefcase,
  DollarSign,
  MapPin,
  Users,
  Building2,
  CheckCircle2,
  Clock,
  History,
  ChevronRight,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';

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

type FormStatus = 'VERIFIED' | 'EXPIRED' | 'REPLACED' | 'PENDING' | undefined;

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
}

// ── Status config ─────────────────────────────────────────────────────────────

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

const STATUS_CONFIG: Record<
  'VERIFIED' | 'EXPIRED' | 'REPLACED' | 'PENDING',
  {
    label: string;
    badgeVariant: BadgeVariant;
    statusIcon: LucideIcon;
    /** Color del círculo del icono principal */
    iconBg: string;
    iconFg: string;
  }
> = {
  VERIFIED: {
    label: 'Verificado',
    badgeVariant: 'success',
    statusIcon: CheckCircle2,
    iconBg: 'bg-primary',
    iconFg: 'text-primary-foreground',
  },
  EXPIRED: {
    label: 'Expirado',
    badgeVariant: 'warning',
    statusIcon: Clock,
    iconBg: 'bg-warning-100',
    iconFg: 'text-warning-700',
  },
  REPLACED: {
    label: 'Reemplazado',
    badgeVariant: 'pending',
    statusIcon: History,
    iconBg: 'bg-muted',
    iconFg: 'text-muted-foreground',
  },
  PENDING: {
    label: 'Pendiente',
    badgeVariant: 'pending',
    statusIcon: Clock,
    iconBg: 'bg-primary-50',
    iconFg: 'text-primary-600',
  },
};

function getStatusConfig(status: FormStatus) {
  return STATUS_CONFIG[status ?? 'PENDING'];
}

// ── Section Card ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  status: FormStatus;
  onViewDetail: () => void;
}

function SectionCard({ icon: Icon, title, description, status, onViewDetail }: SectionCardProps) {
  const config = getStatusConfig(status);

  return (
    <button
      type="button"
      onClick={onViewDetail}
      className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
    >
      <Card className="h-full transition-all duration-200 hover:shadow-md hover:ring-primary-200">
        <CardContent className="flex items-center gap-4 p-4">
          {/* Icono circular — mismo estilo que FormHeader */}
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              config.iconBg,
              config.iconFg
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          {/* Contenido */}
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="text-sm font-semibold text-foreground leading-tight">{title}</h3>
            <p className="text-xs text-muted-foreground leading-snug">{description}</p>
            <Badge variant={config.badgeVariant} className="mt-1.5">
              <config.statusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>

          {/* Chevron */}
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
        </CardContent>
      </Card>
    </button>
  );
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
}: MiExpedienteClientProps) {
  const [editingSection, setEditingSection] = useState<SectionId | null>(null);

  const handleEdit = (section: SectionId) => {
    setEditingSection(section);
  };

  const handleClose = () => {
    setEditingSection(null);
  };

  // ── Vista de edición ──
  if (editingSection) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="gap-2 text-primary hover:text-primary-700 hover:bg-primary-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al expediente
          </Button>
        </div>

        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
          {editingSection === 'kyc' && (
            <FunnelKYCValidation
              dashboardMode
              onClose={handleClose}
              initialData={kycData}
              initialBlocked={kycBlocked}
              initialBlockedHoursLeft={kycBlockedHoursLeft}
              initialAttemptsLeft={kycAttemptsLeft}
            />
          )}
          {editingSection === 'labor' && (
            <FunnelLaborProfileShadcn dashboardMode onClose={handleClose} initialData={laborData} />
          )}
          {editingSection === 'economic' && (
            <FunnelEconomicProfileShadcn dashboardMode onClose={handleClose} initialData={economicData} />
          )}
          {editingSection === 'address' && (
            <FunnelAddressShadcn dashboardMode onClose={handleClose} initialData={addressData} />
          )}
          {editingSection === 'references' && (
            <FunnelReferencesShadcn dashboardMode onClose={handleClose} initialData={referencesData} />
          )}
          {editingSection === 'bank-account' && (
            <FunnelBankAccountShadcn dashboardMode onClose={handleClose} initialData={bankAccountData} />
          )}
        </div>
      </div>
    );
  }

  // ── Vista readonly — grid de secciones ──
  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="Mi Expediente"
        description="Toda tu información personal verificada. Toca una sección para revisar o completar."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard
          icon={Shield}
          title="Identidad"
          description="Verificación de identidad con DNI"
          status={kycData?.status}
          onViewDetail={() => handleEdit('kyc')}
        />
        <SectionCard
          icon={Briefcase}
          title="Perfil Laboral"
          description="Empleo, ingresos y sector"
          status={laborData.status}
          onViewDetail={() => handleEdit('labor')}
        />
        <SectionCard
          icon={DollarSign}
          title="Perfil Económico"
          description="Gastos, deudas y patrimonio"
          status={economicData.status}
          onViewDetail={() => handleEdit('economic')}
        />
        <SectionCard
          icon={MapPin}
          title="Dirección"
          description="Domicilio actual"
          status={addressData.status}
          onViewDetail={() => handleEdit('address')}
        />
        <SectionCard
          icon={Users}
          title="Referencias"
          description="Contactos de referencia personal"
          status={referencesData.status}
          onViewDetail={() => handleEdit('references')}
        />
        <SectionCard
          icon={Building2}
          title="Cuenta Bancaria"
          description="Cuenta para desembolso"
          status={bankAccountData.status}
          onViewDetail={() => handleEdit('bank-account')}
        />
      </div>
    </div>
  );
}
