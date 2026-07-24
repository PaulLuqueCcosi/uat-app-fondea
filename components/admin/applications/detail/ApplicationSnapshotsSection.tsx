'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Database, ChevronDown, ChevronRight, User, Briefcase, DollarSign, MapPin, Building, Users, Smartphone, Target } from 'lucide-react';
import { getFieldLabel } from '@/modules/admin/admin-form-labels';
import type { AdminApplicationCore } from '@/modules/admin/admin-application-detail.service';

interface Props {
  data: AdminApplicationCore;
}

// ── Value formatting ─────────────────────────────────────────────────────────

const ENUM_LABELS: Record<string, string> = {
  // Employment
  EMPLEADO_DEPENDIENTE: 'Empleado dependiente',
  INDEPENDIENTE: 'Independiente',
  EMPRESARIO: 'Empresario',
  FREELANCE: 'Freelance',
  // Industry
  TECNOLOGIA: 'Tecnología',
  SALUD: 'Salud',
  EDUCACION: 'Educación',
  CONSTRUCCION: 'Construcción',
  COMERCIO: 'Comercio',
  SERVICIOS_PROFESIONALES: 'Servicios profesionales',
  OTRO: 'Otro',
  // Income receipt
  CUENTA_BANCARIA: 'Cuenta bancaria',
  EFECTIVO: 'Efectivo',
  BILLETERA_DIGITAL: 'Billetera digital',
  OTROS: 'Otros',
  // Loan purpose
  EDUCACION_PROPIA: 'Educación propia',
  NEGOCIO: 'Negocio',
  SALUD_MEDICA: 'Salud / Médico',
  VIAJE: 'Viaje',
  CONSOLIDAR_DEUDAS: 'Consolidar deudas',
  EMERGENCIA: 'Emergencia',
  MEJORA_HOGAR: 'Mejora de hogar',
  EJEMPLO: 'Ejemplo',
  // Education
  PRIMARIA: 'Primaria',
  SECUNDARIA: 'Secundaria',
  TECNICA: 'Técnica',
  UNIVERSITARIA: 'Universitaria',
  POSTGRADO: 'Postgrado',
  // Relationships
  MADRE: 'Madre',
  PADRE: 'Padre',
  HERMANO: 'Hermano/a',
  HIJO: 'Hijo/a',
  CONYUGE: 'Cónyuge',
  TIO: 'Tío/a',
  PRIMO: 'Primo/a',
  ABUELO: 'Abuelo/a',
  COLEGA: 'Colega',
  AMIGO: 'Amigo/a',
  VECINO: 'Vecino/a',
  CONOCIDO: 'Conocido/a',
  // Referral
  REDES_SOCIALES: 'Redes sociales',
  RECOMENDACION: 'Recomendación',
  BUSCADOR: 'Buscador web',
  PUBLICIDAD: 'Publicidad',
  // Address type
  MANUAL: 'Manual',
  google: 'Google Maps',
};

function humanizeValue(value: any, key?: string): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'number') {
    // Formato moneda para campos que parecen montos
    const moneyKeys = ['amount', 'monthly_income', 'monthlyIncome', 'monthly_expenses', 'monthlyExpenses', 'monthlyPayment', 'monthly_payment', 'savingsAmount', 'maxLoanAmount'];
    if (key && moneyKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
      return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
    }
    return value.toLocaleString('es-PE');
  }
  // Try enum label
  if (typeof value === 'string' && ENUM_LABELS[value]) {
    return ENUM_LABELS[value];
  }
  return String(value);
}

// ── Profile sections config ──────────────────────────────────────────────────

const PROFILE_SECTIONS = [
  { key: 'kyc', label: 'Datos personales (KYC)', icon: User },
  { key: 'labor', label: 'Perfil laboral', icon: Briefcase },
  { key: 'economic', label: 'Perfil económico', icon: DollarSign },
  { key: 'address', label: 'Dirección', icon: MapPin },
  { key: 'bankAccount', label: 'Cuenta bancaria', icon: Building },
  { key: 'references', label: 'Referencias', icon: Users },
] as const;

// ── Component ────────────────────────────────────────────────────────────────

export function ApplicationSnapshotsSection({ data }: Props) {
  const profile = data.profileSnapshot;
  const intention = data.intentionSnapshot;
  const puntaje = data.puntajeSnapshot;
  const fingerprint = data.deviceFingerprintSnapshot;

  const hasAnySnapshot = profile || intention || puntaje || fingerprint;

  if (!hasAnySnapshot) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <Database className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No hay snapshots guardados para esta solicitud</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Intención */}
      {intention && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" /> Intención al momento del submit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataGrid data={intention} formKey="intention" />
          </CardContent>
        </Card>
      )}

      {/* Puntaje */}
      {puntaje && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" /> Puntaje (fidelidad)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataGrid data={puntaje} formKey="puntaje" />
          </CardContent>
        </Card>
      )}

      {/* Perfil del usuario (colapsable por sección) */}
      {profile && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" /> Perfil del usuario al submit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {PROFILE_SECTIONS.map(({ key, label, icon: Icon }) => {
              const sectionData = (profile as Record<string, any>)[key];
              if (!sectionData || (typeof sectionData === 'object' && Object.keys(sectionData).length === 0)) return null;
              return (
                <CollapsibleProfileSection
                  key={key}
                  formKey={key}
                  title={label}
                  icon={Icon}
                  data={sectionData}
                />
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Device fingerprint */}
      {fingerprint && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Smartphone className="h-4 w-4" /> Device fingerprint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataGrid data={fingerprint} formKey="device" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── DataGrid: muestra key-value pairs ────────────────────────────────────────

function DataGrid({ data, formKey }: { data: Record<string, any>; formKey: string }) {
  const entries = flattenForDisplay(data);

  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground">Sin datos</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
      {entries.map(({ key, label, value }) => (
        <div key={key} className="flex flex-col">
          <span className="text-[11px] text-muted-foreground leading-tight">{label}</span>
          <span className="text-sm font-medium text-foreground">{value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Collapsible section ──────────────────────────────────────────────────────

function CollapsibleProfileSection({ formKey, title, icon: Icon, data }: {
  formKey: string;
  title: string;
  icon: React.ElementType;
  data: any;
}) {
  const [open, setOpen] = useState(false);
  const entries = flattenForDisplay(data, formKey);

  return (
    <div className="rounded-lg border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{title}</span>
          <Badge variant="outline" className="text-[10px] font-normal">{entries.length}</Badge>
        </span>
        {open
          ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
          : <ChevronRight className="h-4 w-4 text-muted-foreground" />
        }
      </button>
      {open && (
        <div className="border-t px-4 py-3 bg-muted/10">
          {entries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
              {entries.map(({ key, label, value }) => (
                <div key={key} className="flex flex-col">
                  <span className="text-[11px] text-muted-foreground leading-tight">{label}</span>
                  <span className="text-sm font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Sin datos</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Flatten helper: turns nested objects into flat label/value pairs ──────────

interface DisplayEntry {
  key: string;
  label: string;
  value: string;
}

function flattenForDisplay(data: any, formKey?: string, prefix?: string): DisplayEntry[] {
  if (!data || typeof data !== 'object') {
    // If data is a string that looks like JSON, try to parse it
    if (typeof data === 'string' && (data.startsWith('{') || data.startsWith('['))) {
      try {
        const parsed = JSON.parse(data);
        return flattenForDisplay(parsed, formKey, prefix);
      } catch {
        return [{ key: prefix ?? 'value', label: getFieldLabel(formKey ?? '', prefix ?? 'value'), value: data }];
      }
    }
    return [];
  }

  const entries: DisplayEntry[] = [];

  for (const [rawKey, rawValue] of Object.entries(data)) {
    const fullKey = prefix ? `${prefix}.${rawKey}` : rawKey;

    // Skip internal/meta fields
    if (['id', 'verified', 'status', 'editMetadata', 'overall_verified'].includes(rawKey)) continue;

    // If value is a JSON string, parse it first
    let value = rawValue;
    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
      try {
        value = JSON.parse(value);
      } catch {
        // keep as string
      }
    }

    // Nested object (not array) → recurse with sub-key label prefix
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Special case: location coords
      if ('lat' in (value as any) && 'lng' in (value as any)) {
        entries.push({
          key: fullKey,
          label: getFieldLabel(formKey ?? '', rawKey),
          value: `${(value as any).lat?.toFixed(5)}, ${(value as any).lng?.toFixed(5)}`,
        });
        continue;
      }

      // For known sub-objects (like familyReference), flatten with a header
      const subEntries = flattenForDisplay(value, formKey, fullKey);
      if (subEntries.length > 0) {
        const groupLabel = getFieldLabel(formKey ?? '', rawKey);
        for (const sub of subEntries) {
          entries.push({
            ...sub,
            label: `${groupLabel} → ${sub.label}`,
          });
        }
      }
      continue;
    }

    // Array → format as numbered list or comma-separated
    if (Array.isArray(value)) {
      if (value.length === 0) {
        entries.push({ key: fullKey, label: getFieldLabel(formKey ?? '', rawKey), value: '—' });
      } else if (typeof value[0] === 'object') {
        value.forEach((item, idx) => {
          const itemEntries = flattenForDisplay(item, formKey, `${fullKey}[${idx}]`);
          const groupLabel = `${getFieldLabel(formKey ?? '', rawKey)} #${idx + 1}`;
          for (const sub of itemEntries) {
            entries.push({ ...sub, label: `${groupLabel} → ${sub.label}` });
          }
        });
      } else {
        entries.push({
          key: fullKey,
          label: getFieldLabel(formKey ?? '', rawKey),
          value: (value as any[]).map(v => humanizeValue(v, rawKey)).join(', '),
        });
      }
      continue;
    }

    // Simple value
    entries.push({
      key: fullKey,
      label: getFieldLabel(formKey ?? '', rawKey),
      value: humanizeValue(value, rawKey),
    });
  }

  return entries;
}
