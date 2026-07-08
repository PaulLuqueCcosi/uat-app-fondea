'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DataRow } from '@/components/ui/data-row';
import dynamic from 'next/dynamic';
import {
  EMPLOYMENT_OPTIONS,
  INDUSTRY_OPTIONS,
  INCOME_RECEIPT_OPTIONS,
  ADDITIONAL_INCOME_TYPE_OPTIONS,
} from '@/lib/constants/labor';
import { LOAN_PURPOSE_OPTIONS, EDUCATION_LEVEL_OPTIONS } from '@/lib/constants/economic';
import { ACCOUNT_TYPE_OPTIONS } from '@/lib/constants/bank-account';
import { REFERRAL_SOURCE_OPTIONS } from '@/lib/constants/address';
import { getDepartments, getProvinces, getDistricts } from 'ubigeo-fns';

const LocationMapPicker = dynamic(
  () => import('@/components/forms/solicitar/LocationMapPicker').then((m) => m.LocationMapPicker),
  { ssr: false }
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function findLabel(options: readonly { value: string; label: string }[], value: any): string {
  if (!value) return '—';
  return options.find(o => o.value === value)?.label ?? String(value);
}

function formatCurrency(amount: any): string {
  if (amount === null || amount === undefined) return '—';
  const num = Number(amount);
  if (isNaN(num)) return String(amount);
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0 }).format(num);
}

function boolLabel(val: any): string {
  if (val === null || val === undefined) return '—';
  return val ? 'Sí' : 'No';
}

function resolveUbigeoName(type: 'department' | 'province' | 'district', code: string | undefined | null): string {
  if (!code) return '—';
  try {
    if (type === 'department') {
      const deps = getDepartments();
      return deps.find(d => d.code === code)?.name ?? code;
    }
    if (type === 'province') {
      const regionCode = code.substring(0, 2);
      const provs = getProvinces(regionCode);
      return provs.find(p => p.code === code)?.name ?? code;
    }
    if (type === 'district') {
      const provCode = code.substring(0, 4);
      const dists = getDistricts(provCode);
      return dists.find(d => d.code === code)?.name ?? code;
    }
  } catch {
    return code;
  }
  return code;
}

const FAMILY_RELATIONS: Record<string, string> = {
  MADRE: 'Madre', PADRE: 'Padre', HERMANO: 'Hermano/a', HIJO: 'Hijo/a',
  CONYUGE: 'Cónyuge', TIO: 'Tío/a', PRIMO: 'Primo/a', ABUELO: 'Abuelo/a', OTRO: 'Otro',
};

const NON_FAMILY_RELATIONS: Record<string, string> = {
  COLEGA: 'Colega', AMIGO: 'Amigo/a', VECINO: 'Vecino/a', CONOCIDO: 'Conocido/a', OTRO: 'Otro',
};

// ── Main Component ────────────────────────────────────────────────────────────

interface AdminFormDataViewProps {
  formKey: string;
  data: Record<string, any>;
  /** Si true, no renderiza la Card wrapper — solo el contenido */
  bare?: boolean;
}

export function AdminFormDataView({ formKey, data, bare = false }: AdminFormDataViewProps) {
  if (!data || Object.keys(data).length === 0) {
    if (bare) {
      return <p className="text-sm text-muted-foreground">Sin datos disponibles.</p>;
    }
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Datos actuales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sin datos aprobados disponibles.</p>
        </CardContent>
      </Card>
    );
  }

  const content = (
    <>
      {formKey === 'kyc' && <KycDataView data={data} />}
      {formKey === 'labor' && <LaborDataView data={data} />}
      {formKey === 'economic' && <EconomicDataView data={data} />}
      {formKey === 'references' && <ReferencesDataView data={data} />}
      {formKey === 'address' && <AddressDataView data={data} />}
      {formKey === 'bankAccount' && <BankAccountDataView data={data} />}
    </>
  );

  if (bare) return content;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Datos actuales (último envío aprobado)</CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}

// ── KYC ───────────────────────────────────────────────────────────────────────

function KycDataView({ data }: { data: Record<string, any> }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Datos de Identidad</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DataRow label="DNI" value={data.dni} mono />
          <DataRow label="Código de verificación" value={data.verificationCode} mono />
          <DataRow label="Primer nombre" value={data.firstName} />
          <DataRow label="Segundo nombre" value={data.secondName} />
          <DataRow label="Apellido paterno" value={data.firstLastName} />
          <DataRow label="Apellido materno" value={data.secondLastName} />
          <DataRow label="Fecha de nacimiento" value={data.birthDate} />
        </div>
      </div>
    </div>
  );
}

// ── Labor ─────────────────────────────────────────────────────────────────────

function LaborDataView({ data }: { data: Record<string, any> }) {
  // El JSON puede venir anidado (situation, details, income) o plano
  const situation = data.situation ?? data.employment_status ?? data;
  const details = data.details ?? data;
  const income = data.income ?? data;

  const employmentStatus = typeof situation === 'string' ? situation : situation?.employment_status ?? situation?.situation;
  const industry = details?.industry;
  const yearsOfActivity = details?.yearsOfActivity ?? details?.years_of_activity;
  const businessRuc = details?.businessRuc ?? details?.business_ruc;
  const monthlyIncome = income?.monthlyIncome ?? income?.monthly_income;
  const incomeReceiptMethod = income?.incomeReceiptMethod ?? income?.income_receipt_method;
  const hasAdditionalIncome = income?.hasAdditionalIncome ?? income?.has_additional_income;
  const additionalIncomes = income?.additionalIncomes ?? income?.additional_incomes ?? [];

  return (
    <div className="space-y-6">
      {/* Situación */}
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Situación Laboral</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DataRow label="Situación laboral" value={findLabel(EMPLOYMENT_OPTIONS, employmentStatus)} />
          <DataRow label="Sector" value={findLabel(INDUSTRY_OPTIONS, industry)} />
        </div>
      </div>

      <Separator className="bg-border h-px" />

      {/* Detalles */}
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Detalles Laborales</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {yearsOfActivity != null && (
            <DataRow label="Años de actividad" value={`${yearsOfActivity} ${yearsOfActivity === 1 ? 'año' : 'años'}`} />
          )}
          {businessRuc && <DataRow label="RUC" value={businessRuc} mono />}
        </div>
      </div>

      <Separator className="bg-border h-px" />

      {/* Ingresos */}
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Ingresos</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DataRow label="Ingreso mensual neto" value={formatCurrency(monthlyIncome)} />
          <DataRow label="Cómo recibe sus ingresos" value={findLabel(INCOME_RECEIPT_OPTIONS, incomeReceiptMethod)} />
          <DataRow label="¿Tiene ingresos adicionales?" value={boolLabel(hasAdditionalIncome)} />
        </div>

        {hasAdditionalIncome && Array.isArray(additionalIncomes) && additionalIncomes.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">Detalle:</p>
            {additionalIncomes.map((inc: any, i: number) => {
              const typeLabel = findLabel(ADDITIONAL_INCOME_TYPE_OPTIONS, inc.type);
              const label = inc.type === 'OTRO' && inc.customType ? inc.customType : typeLabel;
              return (
                <div key={i} className="flex items-center justify-between text-sm border rounded-md px-3 py-2 bg-muted/30">
                  <span className="text-foreground">{label}</span>
                  <span className="font-semibold">{formatCurrency(inc.amount)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Economic ──────────────────────────────────────────────────────────────────

function EconomicDataView({ data }: { data: Record<string, any> }) {
  const loanPurpose = data.loanPurpose ?? data.loan_purpose;
  const monthlyExpenses = data.monthlyExpenses ?? data.monthly_expenses;
  const hasDebts = data.hasDebts ?? data.has_debts;
  const debts: any[] = data.debts ?? [];
  const hasProperty = data.hasProperty ?? data.has_property;
  const hasVehicle = data.hasVehicle ?? data.has_vehicle;
  const educationLevel = data.educationLevel ?? data.education_level;

  const DEBT_TYPES: { value: string; label: string }[] = [
    { value: 'personal', label: 'Préstamo personal' },
    { value: 'credit_card', label: 'Tarjeta de crédito' },
    { value: 'mortgage', label: 'Hipotecario' },
    { value: 'auto', label: 'Vehicular' },
    { value: 'other', label: 'Otro' },
  ];

  return (
    <div className="space-y-6">
      {/* Propósito */}
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Propósito</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DataRow label="Propósito del préstamo" value={findLabel(LOAN_PURPOSE_OPTIONS, loanPurpose)} />
          <DataRow label="Nivel educativo" value={findLabel(EDUCATION_LEVEL_OPTIONS, educationLevel)} />
        </div>
      </div>

      <Separator className="bg-border h-px" />

      {/* Gastos */}
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Gastos mensuales</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DataRow label="Gastos mensuales totales" value={formatCurrency(monthlyExpenses)} />
        </div>
      </div>

      <Separator className="bg-border h-px" />

      {/* Deudas */}
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Deudas</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DataRow label="¿Tiene deudas actualmente?" value={boolLabel(hasDebts)} />
        </div>

        {hasDebts && Array.isArray(debts) && debts.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Detalle de deudas:</p>
            <div className="space-y-2">
              {debts.map((debt: any, i: number) => {
                const debtTypeLabel = DEBT_TYPES.find(o => o.value === debt.type)?.label ?? debt.type ?? '—';
                const entity = debt.creditor ?? debt.entity ?? '—';
                const amount = debt.amount;
                const monthlyPayment = debt.monthlyPayment ?? debt.monthly_payment;

                return (
                  <div key={i} className="border rounded-lg px-3 py-2.5 bg-muted/30">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{entity}</p>
                        <p className="text-xs text-muted-foreground">{debtTypeLabel}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Monto total:</span>
                        <span className="font-semibold text-foreground ml-1">{formatCurrency(amount)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cuota mensual:</span>
                        <span className="font-semibold text-foreground ml-1">{formatCurrency(monthlyPayment)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Separator className="bg-border h-px" />

      {/* Patrimonio */}
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Patrimonio</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DataRow label="¿Tiene propiedad?" value={boolLabel(hasProperty)} />
          <DataRow label="¿Tiene vehículo?" value={boolLabel(hasVehicle)} />
        </div>
      </div>
    </div>
  );
}

// ── References ────────────────────────────────────────────────────────────────

function ReferencesDataView({ data }: { data: Record<string, any> }) {
  // El JSON viene como { familyReference: {...}, nonFamilyReference: {...} }
  const family = data.familyReference ?? data.family_reference;
  const nonFamily = data.nonFamilyReference ?? data.non_family_reference;

  const familyName = family?.name ?? data.familyName ?? data.family_name;
  const familyPhone = family?.phone ?? data.familyPhone ?? data.family_phone;
  const familyRelation = family?.relationship ?? data.familyRelation ?? data.family_relation;
  const familyRelationOther = family?.relationshipOther ?? data.relationshipOther;

  const nonFamilyName = nonFamily?.name ?? data.nonFamilyName ?? data.non_family_name;
  const nonFamilyPhone = nonFamily?.phone ?? data.nonFamilyPhone ?? data.non_family_phone;
  const nonFamilyRelation = nonFamily?.relationship ?? data.nonFamilyRelation ?? data.non_family_relation;
  const nonFamilyRelationOther = nonFamily?.relationshipOther;
  const nonFamilyYearsKnown = nonFamily?.yearsKnown ?? data.yearsKnown;

  const getFamilyRelLabel = (rel: string | undefined) => {
    if (!rel) return '—';
    if (rel === 'OTRO') return familyRelationOther?.trim() || 'Otro';
    return FAMILY_RELATIONS[rel] ?? rel;
  };

  const getNonFamilyRelLabel = (rel: string | undefined) => {
    if (!rel) return '—';
    if (rel === 'OTRO') return nonFamilyRelationOther?.trim() || 'Otro';
    return NON_FAMILY_RELATIONS[rel] ?? rel;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Referencia Familiar</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DataRow label="Nombre completo" value={familyName} />
          <DataRow label="Teléfono" value={familyPhone} mono />
          <DataRow label="Parentesco" value={getFamilyRelLabel(familyRelation)} />
        </div>
      </div>
      <Separator className="bg-border h-px" />
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Referencia No Familiar</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DataRow label="Nombre completo" value={nonFamilyName} />
          <DataRow label="Teléfono" value={nonFamilyPhone} mono />
          <DataRow label="Relación" value={getNonFamilyRelLabel(nonFamilyRelation)} />
          {nonFamilyYearsKnown != null && (
            <DataRow label="Años de conocerse" value={`${nonFamilyYearsKnown} ${nonFamilyYearsKnown === 1 ? 'año' : 'años'}`} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Address ───────────────────────────────────────────────────────────────────

function AddressDataView({ data }: { data: Record<string, any> }) {
  const streetAddress = data.streetAddress ?? data.street_address ?? data.google_address;
  const region = data.region;
  const province = data.province;
  const district = data.district;
  const referralSource = data.referralSource ?? data.referral_source;
  const lat = data.lat;
  const lng = data.lng;
  const hasLocation = lat != null && lng != null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Domicilio</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DataRow label="Dirección" value={streetAddress} />
          <DataRow label="Departamento" value={resolveUbigeoName('department', region)} />
          <DataRow label="Provincia" value={resolveUbigeoName('province', province)} />
          <DataRow label="Distrito" value={resolveUbigeoName('district', district)} />
          <DataRow label="¿Cómo nos conociste?" value={findLabel(REFERRAL_SOURCE_OPTIONS, referralSource)} />
        </div>
      </div>

      {hasLocation && (
        <>
          <Separator className="bg-border h-px" />
          <div>
            <p className="text-sm font-medium mb-2">Ubicación registrada</p>
            <div style={{ position: 'relative', zIndex: 0, isolation: 'isolate' }}>
              <LocationMapPicker
                value={{ lat: Number(lat), lng: Number(lng) }}
                onChange={() => {}}
                height={200}
                readOnly
                mapCenter={{ lat: Number(lat), lng: Number(lng) }}
                mapZoom={14}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Bank Account ──────────────────────────────────────────────────────────────

function BankAccountDataView({ data }: { data: Record<string, any> }) {
  const bankName = data.bank_name ?? data.bankName;
  const accountType = data.account_type ?? data.accountType;
  const cci = data.cci ?? data.cci_masked;
  const accountNumber = data.account_number ?? data.accountNumber ?? data.account_number_masked;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Cuenta Bancaria</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DataRow label="Banco" value={bankName} />
          <DataRow label="Tipo de cuenta" value={findLabel(ACCOUNT_TYPE_OPTIONS, accountType)} />
          <DataRow label="Número de cuenta" value={accountNumber} mono />
          <DataRow label="CCI" value={cci} mono />
        </div>
      </div>
    </div>
  );
}
