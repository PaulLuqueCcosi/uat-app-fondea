'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormHeader } from '@/components/ui/form-header';
import {
  CheckCircle,
  DollarSign,
  Briefcase,
  Users,
  MapPin,
  AlertCircle,
  Building2,
  Edit,
  Home,
  FileText,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { submitApplicationAction } from '@/app/actions/application.actions';
import {
  KYCData,
  LaborProfileStatus,
  EconomicProfileStatus,
  ReferencesProfileStatus,
  AddressProfileStatus,
  BankAccountProfileStatus
} from '@/lib/types';
import {
  EMPLOYMENT_OPTIONS,
  INDUSTRY_OPTIONS,
  ADDITIONAL_INCOME_TYPE_OPTIONS,
  LOAN_PURPOSE_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  INCOME_RECEIPT_OPTIONS,
  REFERRAL_SOURCE_OPTIONS,
  ACCOUNT_TYPE_OPTIONS,
} from '@/lib/constants';
import { SaveErrorBanner } from '@/components/ui/save-error-banner';

// Helper functions para obtener labels
const getEmploymentLabel = (value?: string) => {
  if (!value) return 'No especificado';
  return EMPLOYMENT_OPTIONS.find(opt => opt.value === value)?.label || value;
};

const getIndustryLabel = (value?: string) => {
  if (!value) return 'No especificado';
  return INDUSTRY_OPTIONS.find(opt => opt.value === value)?.label || value;
};

const getIncomeTypeLabel = (value?: string) => {
  if (!value) return 'No especificado';
  return ADDITIONAL_INCOME_TYPE_OPTIONS.find(opt => opt.value === value)?.label || value;
};

const getLoanPurposeLabel = (value?: string) => {
  if (!value) return 'No especificado';
  return LOAN_PURPOSE_OPTIONS.find(opt => opt.value === value)?.label || value;
};

const getEducationLevelLabel = (value?: string) => {
  if (!value) return 'No especificado';
  return EDUCATION_LEVEL_OPTIONS.find(opt => opt.value === value)?.label || value;
};

const getIncomeReceiptLabel = (value?: string) => {
  if (!value) return 'No especificado';
  return INCOME_RECEIPT_OPTIONS.find(opt => opt.value === value)?.label || value;
};

const getReferralSourceLabel = (value?: string, other?: string) => {
  if (!value) return 'No especificado';
  if (value === 'OTRO') return other?.trim() || 'Otro';
  return REFERRAL_SOURCE_OPTIONS.find(opt => opt.value === value)?.label || value;
};

const getAccountTypeLabel = (value?: string) => {
  if (!value) return 'No especificado';
  return ACCOUNT_TYPE_OPTIONS.find(opt => opt.value === value)?.label || value;
};

const FAMILY_RELATIONS_MAP: Record<string, string> = {
  MADRE: 'Madre', PADRE: 'Padre', HERMANO: 'Hermano/a', HIJO: 'Hijo/a',
  CONYUGE: 'Cónyuge', TIO: 'Tío/a', PRIMO: 'Primo/a', ABUELO: 'Abuelo/a',
};
const NON_FAMILY_RELATIONS_MAP: Record<string, string> = {
  COLEGA: 'Colega', AMIGO: 'Amigo/a', VECINO: 'Vecino/a', CONOCIDO: 'Conocido/a',
};

const getRelationLabel = (
  relationship?: string,
  relationship_other?: string,
  map?: Record<string, string>
): string => {
  if (!relationship) return 'No especificado';
  if (relationship === 'OTRO') return relationship_other?.trim() || 'Otro';
  return map?.[relationship] ?? relationship;
};

interface FunnelSummaryProps {
  kycData: KYCData | null;
  laborData: LaborProfileStatus;
  economicData: EconomicProfileStatus;
  referencesData: ReferencesProfileStatus;
  addressData: AddressProfileStatus;
  bankAccountData: BankAccountProfileStatus;
  ubigeoNames?: {
    region: string;
    province: string;
    district: string;
  };
}

export function FunnelSummary({
  kycData,
  laborData,
  economicData,
  referencesData,
  addressData,
  bankAccountData,
  ubigeoNames
}: FunnelSummaryProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveErrorCategory, setSaveErrorCategory] = useState<import('@/lib/types').ErrorCategory | undefined>(undefined);

  // Estado para controlar qué secciones están expandidas
  const [expandedSections, setExpandedSections] = useState({
    kyc: true,
    labor: true,
    economic: true,
    references: true,
    address: true,
    bankAccount: true
  });

  // Estado de las declaraciones PEP
  const [pepDeclarations, setPepDeclarations] = useState({
    not_pep: false,
    not_pep_relative: false,
    accept_terms: false,
  });

  // Estado para mostrar/ocultar CCI
  const [showCCI, setShowCCI] = useState(false);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSubmit = async () => {
    if (!pepDeclarations.not_pep || !pepDeclarations.not_pep_relative || !pepDeclarations.accept_terms) {
      setSaveError('Debes aceptar todas las declaraciones para continuar.');
      setSaveErrorCategory('validation');
      return;
    }

    setLoading(true);
    setSaveError(null);
    setSaveErrorCategory(undefined);
    try {
      const result = await submitApplicationAction(pepDeclarations);

      if (!result.success || !result.applicationId) {
        setSaveError(result.error ?? 'Error al enviar la solicitud. Intenta nuevamente.');
        setSaveErrorCategory(result.errorCategory);
        return;
      }

      // Navega a la página principal de la solicitud
      // Esta página redirigirá automáticamente a /evaluando si está en proceso
      router.push(`/solicitudes/${result.applicationId}`);
    } catch (err) {
      console.error('Error submitting application:', err);
      setSaveError('Error al enviar la solicitud. Intenta nuevamente.');
      setSaveErrorCategory('network');
    } finally {
      setLoading(false);
    }
  };

  // Calcular totales basados en datos reales
  const laborIncome = laborData.income;
  const totalIncome = laborIncome ?
    laborIncome.monthly_income + (laborIncome.additional_incomes?.reduce((sum, inc) => sum + inc.amount, 0) || 0) : 0;

  const economicProfile = economicData.profile;
  const totalDebtPayment = economicProfile?.debts?.reduce((sum, debt) => sum + debt.monthlyPayment, 0) || 0;
  const monthlyExpenses = economicProfile?.monthly_expenses || 0;
  const availableIncome = totalIncome - monthlyExpenses - totalDebtPayment;

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader className="pb-4">
        <FormHeader
          icon={FileText}
          title="Resumen de tu Solicitud"
          description="Revisa que toda la información sea correcta antes de continuar"
        />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-6">
        {/* 0. VERIFICACIÓN DE IDENTIDAD (KYC) */}
        <Card className="border-2 overflow-hidden">
          <div className="w-full p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <button
                  className="p-2 bg-primary/10 rounded-lg cursor-pointer"
                  onClick={() => toggleSection('kyc')}
                >
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </button>
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => toggleSection('kyc')}
                >
                  <h3 className="text-lg font-semibold text-foreground">Verificación de Identidad</h3>
                  {!expandedSections.kyc && (
                    <p className="text-sm text-muted-foreground">
                      {kycData ? `DNI: ${kycData.dni} • ${kycData.firstName} ${kycData.firstLastName}` : 'No completado'}
                    </p>
                  )}
                  {expandedSections.kyc && (
                    <p className="text-sm text-muted-foreground">Tus datos personales verificados</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={kycData?.verified ? "success" : "secondary"}>
                  {kycData?.verified ? "Verificado" : "Pendiente"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => router.push('/solicitar/kyc-validation')}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <button
                  onClick={() => toggleSection('kyc')}
                  className="cursor-pointer"
                >
                  {expandedSections.kyc ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {expandedSections.kyc && (
            <div className="px-6 pb-6 space-y-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">DNI</p>
                  <p className="font-mono font-medium text-foreground">{kycData?.dni || 'No especificado'}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Código de verificación</p>
                  <p className="font-mono font-medium text-foreground">{kycData?.verificationCode || 'No especificado'}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nombres</p>
                  <p className="font-medium text-foreground">
                    {kycData ? `${kycData.firstName} ${kycData.secondName}` : 'No especificado'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Apellidos</p>
                  <p className="font-medium text-foreground">
                    {kycData ? `${kycData.firstLastName} ${kycData.secondLastName}` : 'No especificado'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Fecha de nacimiento</p>
                  <p className="font-medium text-foreground">{kycData?.birth_date || 'No especificado'}</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* 1. PERFIL LABORAL */}
        <Card className="border-2 overflow-hidden">
          <div className="w-full p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <button
                  className="p-2 bg-primary/10 rounded-lg cursor-pointer"
                  onClick={() => toggleSection('labor')}
                >
                  <Briefcase className="w-5 h-5 text-primary" />
                </button>
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => toggleSection('labor')}
                >
                  <h3 className="text-lg font-semibold text-foreground">Perfil Laboral</h3>
                  {!expandedSections.labor && (
                    <p className="text-sm text-muted-foreground">
                      {getEmploymentLabel(laborData.situation?.employment_status)} • S/ {totalIncome.toLocaleString()}/mes
                    </p>
                  )}
                  {expandedSections.labor && (
                    <p className="text-sm text-muted-foreground">Información sobre tu empleo</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={laborData.overall_verified ? "success" : "secondary"}>
                  {laborData.overall_verified ? "Completo" : "Pendiente"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => router.push('/solicitar/labor')}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <button
                  onClick={() => toggleSection('labor')}
                  className="cursor-pointer"
                >
                  {expandedSections.labor ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {expandedSections.labor && (
            <div className="px-6 pb-6 space-y-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Situación laboral</p>
                  <p className="font-medium text-foreground">{getEmploymentLabel(laborData.situation?.employment_status)}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Sector / Industria</p>
                    <p className="font-medium text-foreground">{getIndustryLabel(laborData.details?.industry)}</p>
                  </div>

                {laborData.situation?.employment_status === 'EMPLEADO_DEPENDIENTE' && (
                  <>
                    {laborData.details?.years_of_activity !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Tiempo en la empresa</p>
                        <p className="font-medium text-foreground">
                          {laborData.details.years_of_activity} {laborData.details.years_of_activity === 1 ? 'año' : 'años'}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {['INDEPENDIENTE', 'FREELANCE', 'EMPRESARIO'].includes(laborData.situation?.employment_status || '') && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Años de actividad</p>
                    <p className="font-medium text-foreground">
                      {laborData.details?.years_of_activity !== undefined
                        ? `${laborData.details.years_of_activity} ${laborData.details.years_of_activity === 1 ? 'año' : 'años'}`
                        : 'No especificado'}
                    </p>
                  </div>
                )}

                {laborData.situation?.employment_status === 'EMPRESARIO' && laborData.details?.business_ruc && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">RUC del negocio</p>
                    <p className="font-mono font-medium text-foreground">{laborData.details.business_ruc}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ingreso mensual</p>
                  <p className="font-semibold text-foreground text-lg">S/ {laborData.income?.monthly_income?.toLocaleString() || '0'}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Cómo recibes tus ingresos</p>
                  <p className="font-medium text-foreground">{getIncomeReceiptLabel(laborData.income?.income_receipt_method)}</p>
                </div>

                {laborData.income?.has_additional_income && laborData.income?.additional_incomes && laborData.income.additional_incomes.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">Ingresos adicionales</p>
                    <div className="space-y-2">
                      {laborData.income.additional_incomes.map((inc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {inc.type === 'OTRO' && inc.custom_type ? inc.custom_type : getIncomeTypeLabel(inc.type)}
                            </p>
                            {inc.description && (
                              <p className="text-xs text-muted-foreground">{inc.description}</p>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-foreground">S/ {inc.amount.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* 2. PERFIL ECONÓMICO */}
        <Card className="border-2 overflow-hidden">
          <div className="w-full p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <button
                  className="p-2 bg-primary/10 rounded-lg cursor-pointer"
                  onClick={() => toggleSection('economic')}
                >
                  <DollarSign className="w-5 h-5 text-primary" />
                </button>
                <div className="flex-1 cursor-pointer" onClick={() => toggleSection('economic')}>
                  <h3 className="text-lg font-semibold text-foreground">Perfil Económico</h3>
                  {!expandedSections.economic && (
                    <p className="text-sm text-muted-foreground">
                      Gastos S/ {monthlyExpenses.toLocaleString()} • {economicProfile?.debts?.length || 0} deudas • Capacidad: S/ {availableIncome.toLocaleString()}
                    </p>
                  )}
                  {expandedSections.economic && (
                    <p className="text-sm text-muted-foreground">Gastos, deudas y patrimonio</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={economicData.overall_verified ? "success" : "secondary"}>
                  {economicData.overall_verified ? "Completo" : "Pendiente"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => router.push('/solicitar/economic')}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <button
                  onClick={() => toggleSection('economic')}
                  className="cursor-pointer"
                >
                  {expandedSections.economic ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {expandedSections.economic && (
            <div className="px-6 pb-6 space-y-4 border-t">
              {/* Resumen financiero */}
              <div className="bg-muted/50 rounded-lg p-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ingresos totales</p>
                    <p className="text-lg font-bold text-primary">S/ {totalIncome.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Gastos + Deudas</p>
                    <p className="text-lg font-bold text-foreground">
                      S/ {(monthlyExpenses + totalDebtPayment).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Capacidad de pago</p>
                    <p className="text-lg font-bold text-green-600">S/ {availableIncome.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Para qué usarás el préstamo</p>
                  <p className="font-medium text-foreground">{getLoanPurposeLabel(economicProfile?.loan_purpose)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Grado de instrucción</p>
                  <p className="font-medium text-foreground">{getEducationLevelLabel(economicProfile?.education_level)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Gastos mensuales</p>
                  <p className="font-medium text-foreground">S/ {monthlyExpenses.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Deudas activas</p>
                  <p className="font-medium text-foreground">
                    {economicProfile?.has_debts ? `${economicProfile?.debts?.length || 0} deuda(s)` : 'Sin deudas'}
                  </p>
                </div>

                {economicProfile?.has_debts && economicProfile?.debts && economicProfile.debts.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">Detalle de deudas</p>
                    <div className="space-y-2">
                      {economicProfile.debts.map((debt, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{debt.entity} - {debt.type}</p>
                            <p className="text-xs text-muted-foreground">Saldo: S/ {debt.amount.toLocaleString()}</p>
                          </div>
                          <p className="text-sm font-semibold text-foreground">S/ {debt.monthlyPayment}/mes</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Patrimonio</p>
                  <div className="flex gap-2 flex-wrap">
                    {economicProfile?.has_property && (
                      <Badge variant="outline">Inmueble propio</Badge>
                    )}
                    {economicProfile?.has_vehicle && (
                      <Badge variant="outline">Vehículo propio</Badge>
                    )}
                    {!economicProfile?.has_property && !economicProfile?.has_vehicle && (
                      <span className="text-sm text-muted-foreground">Sin patrimonio declarado</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Servicios a su nombre</p>
                  <p className="font-medium text-foreground">{economicProfile?.has_services ? 'Sí' : 'No'}</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* 3. REFERENCIAS */}
        <Card className="border-2 overflow-hidden">
          <div className="w-full p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <button
                  className="p-2 bg-primary/10 rounded-lg cursor-pointer"
                  onClick={() => toggleSection('references')}
                >
                  <Users className="w-5 h-5 text-primary" />
                </button>
                <div className="flex-1 cursor-pointer" onClick={() => toggleSection('references')}>
                  <h3 className="text-lg font-semibold text-foreground">Referencias Personales</h3>
                  {!expandedSections.references && (
                    <p className="text-sm text-muted-foreground">
                      {referencesData.profile ? '2 referencias agregadas' : 'No completado'}
                    </p>
                  )}
                  {expandedSections.references && (
                    <p className="text-sm text-muted-foreground">Personas que te conocen</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={referencesData.overall_verified ? "success" : "secondary"}>
                  {referencesData.overall_verified ? "Completo" : "Pendiente"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => router.push('/solicitar/references')}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <button
                  onClick={() => toggleSection('references')}
                  className="cursor-pointer"
                >
                  {expandedSections.references ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {expandedSections.references && (
            <div className="px-6 pb-6 border-t pt-4">
              <div className="space-y-3">
                {referencesData.profile ? (
                  <>
                    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{referencesData.profile.family_reference.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {referencesData.profile.family_reference.phone} • {getRelationLabel(referencesData.profile.family_reference.relationship, referencesData.profile.family_reference.relationship_other, FAMILY_RELATIONS_MAP)} • Familiar
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{referencesData.profile.non_family_reference.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {referencesData.profile.non_family_reference.phone} • {getRelationLabel(referencesData.profile.non_family_reference.relationship, referencesData.profile.non_family_reference.relationship_other, NON_FAMILY_RELATIONS_MAP)} • {referencesData.profile.non_family_reference.years_known} años de conocidos
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay referencias agregadas</p>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* 4. DIRECCIÓN */}
        <Card className="border-2 overflow-hidden">
          <div className="w-full p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <button
                  className="p-2 bg-primary/10 rounded-lg cursor-pointer"
                  onClick={() => toggleSection('address')}
                >
                  <MapPin className="w-5 h-5 text-primary" />
                </button>
                <div className="flex-1 cursor-pointer" onClick={() => toggleSection('address')}>
                  <h3 className="text-lg font-semibold text-foreground">Dirección de Residencia</h3>
                  {!expandedSections.address && (
                    <p className="text-sm text-muted-foreground">
                      {ubigeoNames?.district || 'No especificado'}, {ubigeoNames?.province || 'No especificado'}
                    </p>
                  )}
                  {expandedSections.address && (
                    <p className="text-sm text-muted-foreground">Tu domicilio actual</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={addressData.overall_verified ? "success" : "secondary"}>
                  {addressData.overall_verified ? "Completo" : "Pendiente"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => router.push('/solicitar/additional')}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <button
                  onClick={() => toggleSection('address')}
                  className="cursor-pointer"
                >
                  {expandedSections.address ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {expandedSections.address && (
            <div className="px-6 pb-6 border-t pt-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Dirección completa</p>
                  <p className="font-medium text-foreground">
                    {addressData.profile?.address_type === 'google'
                      ? addressData.profile?.google_address
                      : addressData.profile?.street_address || 'No especificado'}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Distrito</p>
                    <p className="font-medium text-foreground">{ubigeoNames?.district || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Provincia</p>
                    <p className="font-medium text-foreground">{ubigeoNames?.province || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Departamento</p>
                    <p className="font-medium text-foreground">{ubigeoNames?.region || 'No especificado'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">¿Cómo nos conociste?</p>
                  <p className="font-medium text-foreground">
                    {getReferralSourceLabel(addressData.profile?.referral_source, addressData.profile?.referral_other)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* 5. CUENTA BANCARIA */}
        <Card className="border-2 overflow-hidden">
          <div className="w-full p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <button
                  className="p-2 bg-primary/10 rounded-lg cursor-pointer"
                  onClick={() => toggleSection('bankAccount')}
                >
                  <Building2 className="w-5 h-5 text-primary" />
                </button>
                <div className="flex-1 cursor-pointer" onClick={() => toggleSection('bankAccount')}>
                  <h3 className="text-lg font-semibold text-foreground">Cuenta para Desembolso</h3>
                  {!expandedSections.bankAccount && (
                    <p className="text-sm text-muted-foreground">
                      {bankAccountData.profile?.bank || 'No especificado'} • •••{bankAccountData.profile?.cci?.slice(-4) || '****'}
                    </p>
                  )}
                  {expandedSections.bankAccount && (
                    <p className="text-sm text-muted-foreground">Donde recibirás el préstamo</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={bankAccountData.overall_verified ? "success" : "secondary"}>
                  {bankAccountData.overall_verified ? "Completo" : "Pendiente"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => router.push('/solicitar/bank-account')}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <button
                  onClick={() => toggleSection('bankAccount')}
                  className="cursor-pointer"
                >
                  {expandedSections.bankAccount ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {expandedSections.bankAccount && (
            <div className="px-6 pb-6 border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Banco</p>
                  <p className="font-medium text-foreground">{bankAccountData.profile?.bank || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tipo de cuenta</p>
                  <p className="font-medium text-foreground">{getAccountTypeLabel(bankAccountData.profile?.account_type)}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">CCI</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm text-foreground flex-1">
                      {bankAccountData.profile?.cci
                        ? showCCI
                          ? bankAccountData.profile.cci
                          : '•••••••••••••••' + bankAccountData.profile.cci.slice(-4)
                        : 'No especificado'}
                    </p>
                    {bankAccountData.profile?.cci && (
                      <button
                        type="button"
                        onClick={() => setShowCCI(!showCCI)}
                        className="p-2 hover:bg-muted rounded-md transition-colors"
                        aria-label={showCCI ? 'Ocultar CCI' : 'Mostrar CCI'}
                      >
                        {showCCI ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* DECLARACIONES LEGALES */}
        <Card className="p-6 bg-primary/5 border-2 border-primary/20">
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-4">Declaraciones Legales</h4>
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={pepDeclarations.not_pep}
                    onChange={(e) => setPepDeclarations(prev => ({ ...prev, not_pep: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground leading-relaxed">
                    Declaro que <strong>no soy Persona Expuesta Políticamente (PEP)</strong>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={pepDeclarations.not_pep_relative}
                    onChange={(e) => setPepDeclarations(prev => ({ ...prev, not_pep_relative: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground leading-relaxed">
                    Declaro que <strong>no soy pariente de una PEP hasta el 2do grado de consanguinidad o afinidad</strong>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={pepDeclarations.accept_terms}
                    onChange={(e) => setPepDeclarations(prev => ({ ...prev, accept_terms: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground leading-relaxed">
                    Acepto los <strong>Términos y Condiciones</strong> y consiento el uso de mis datos personales
                  </span>
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                Fondea se reserva el derecho de solicitar documentación adicional para verificar la información proporcionada.
                La falsedad de datos puede resultar en el rechazo inmediato de la solicitud.
              </p>
            </div>
          </div>
        </Card>

        {/* ERROR MESSAGE */}
        {saveError && (
          <SaveErrorBanner
            error={saveError}
            errorCategory={saveErrorCategory}
          />
        )}

        {/* BOTONES DE ACCIÓN */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="flex-1"
            size="lg"
          >
            <Home className="w-4 h-4 mr-2" />
            Volver al dashboard
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !pepDeclarations.not_pep || !pepDeclarations.not_pep_relative || !pepDeclarations.accept_terms}
            className="flex-1"
            size="lg"
          >
            {loading ? 'Enviando...' : 'Enviar solicitud y continuar →'}
          </Button>
        </div>
        </div>
      </CardContent>
    </Card>
  );
}
