'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StickyBottomBar } from '@/components/ui/sticky-bottom-bar';
import { MapPin, Home, Calendar } from 'lucide-react';
import { saveAdditional } from '@/app/actions/loan.actions';
import type { AdditionalData } from '@/lib/types';

interface FunnelAdditionalInfoProps {
  dashboardMode?: boolean;
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
}

function FormField({ label, required, error, helpText, children }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-dark">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {children}
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

export function FunnelAdditionalInfo({ dashboardMode }: FunnelAdditionalInfoProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<AdditionalData>({
    address: '',
    district: '',
    city: 'Lima',
    department: 'Lima',
    housingType: 'rent',
    yearsAtAddress: 0,
    educationLevel: 'university',
    maritalStatus: 'single',
    dependents: 0,
  });

  const updateField = (field: keyof AdditionalData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!form.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }
    if (form.address.trim().length < 10) {
      newErrors.address = 'La dirección debe tener al menos 10 caracteres';
    }

    if (!form.district.trim()) {
      newErrors.district = 'El distrito es requerido';
    }

    if (!form.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }

    if (!form.department.trim()) {
      newErrors.department = 'El departamento es requerido';
    }

    if (form.yearsAtAddress < 0) {
      newErrors.yearsAtAddress = 'Los años en la dirección no pueden ser negativos';
    }

    if (form.dependents < 0) {
      newErrors.dependents = 'El número de dependientes no puede ser negativo';
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      await saveAdditional(form);
      if (dashboardMode) {
        router.push('/dashboard');
      } else {
        router.push('/solicitar/bank-account');
      }
    } catch (error) {
      console.error('Error saving additional info:', error);
      setErrors({ submit: 'Error al guardar. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-dark mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Dirección de Residencia
        </h3>
        <div className="space-y-4">
          <FormField label="Dirección completa" required error={errors.address} helpText="Incluye calle, número, piso/dpto si aplica">
            <input
              type="text"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Ej: Av. Javier Prado Este 123, Dpto. 456"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Distrito" required error={errors.district}>
              <input
                type="text"
                value={form.district}
                onChange={(e) => updateField('district', e.target.value)}
                placeholder="Ej: San Isidro"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </FormField>
            <FormField label="Ciudad" required error={errors.city}>
              <input
                type="text"
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Ej: Lima"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </FormField>
          </div>

          <FormField label="Departamento" required error={errors.department}>
            <input
              type="text"
              value={form.department}
              onChange={(e) => updateField('department', e.target.value)}
              placeholder="Ej: Lima"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </FormField>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-dark mb-4 flex items-center gap-2">
          <Home className="w-5 h-5 text-primary" />
          Vivienda
        </h3>
        <div className="space-y-4">
          <FormField label="Tipo de vivienda" required>
            <select
              value={form.housingType}
              onChange={(e) => updateField('housingType', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="own">Casa propia</option>
              <option value="rent">Alquilada</option>
              <option value="family">Familiar</option>
              <option value="mortgage">Hipotecada</option>
              <option value="other">Otro</option>
            </select>
          </FormField>

          <FormField label="Años viviendo en esta dirección" required error={errors.yearsAtAddress}>
            <input
              type="number"
              value={form.yearsAtAddress || ''}
              onChange={(e) => updateField('yearsAtAddress', Number(e.target.value))}
              placeholder="Ej: 3"
              min={0}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </FormField>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-dark mb-4">Información Personal</h3>
        <div className="space-y-4">
          <FormField label="Nivel educativo" required>
            <select
              value={form.educationLevel}
              onChange={(e) => updateField('educationLevel', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="primary">Primaria</option>
              <option value="secondary">Secundaria</option>
              <option value="technical">Técnico</option>
              <option value="university">Universitario</option>
              <option value="postgraduate">Postgrado</option>
            </select>
          </FormField>

          <FormField label="Estado civil" required>
            <select
              value={form.maritalStatus}
              onChange={(e) => updateField('maritalStatus', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="single">Soltero(a)</option>
              <option value="married">Casado(a)</option>
              <option value="divorced">Divorciado(a)</option>
              <option value="widowed">Viudo(a)</option>
              <option value="cohabiting">Conviviente</option>
            </select>
          </FormField>

          <FormField label="Número de dependientes" required error={errors.dependents} helpText="Personas que dependen económicamente de ti">
            <input
              type="number"
              value={form.dependents || ''}
              onChange={(e) => updateField('dependents', Number(e.target.value))}
              placeholder="0"
              min={0}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </FormField>
        </div>
      </div>

      {errors.submit && (
        <div className="p-4 bg-error/10 border border-error rounded-lg">
          <p className="text-sm text-error">{errors.submit}</p>
        </div>
      )}

      {!dashboardMode && (
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          Continuar →
        </Button>
      )}
    </div>
  );

  if (dashboardMode) {
    return (
      <>
        {content}
        <StickyBottomBar
          ctaLabel="Guardar y volver al dashboard"
          onCta={handleSubmit}
          loading={loading}
        />
      </>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-2">
          Información Adicional
        </h1>
        <p className="text-fondea-text">
          Solo unos datos más para completar tu perfil.
        </p>
      </div>
      <Card>{content}</Card>
    </div>
  );
}
