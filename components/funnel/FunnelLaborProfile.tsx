'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StickyBottomBar } from '@/components/ui/sticky-bottom-bar';
import { saveLaborProfile } from '@/app/actions/loan.actions';
import type { LaborData } from '@/lib/types';

interface FunnelLaborProfileProps {
  dashboardMode?: boolean;
}

const EMPLOYMENT_OPTIONS = [
  { value: 'EMPLEADO_DEPENDIENTE', label: 'Empleado en planilla' },
  { value: 'INDEPENDIENTE', label: 'Trabajador independiente' },
  { value: 'EMPRESARIO', label: 'Dueño de negocio' },
  { value: 'FREELANCE', label: 'Freelancer / Consultor' },
];

const INDUSTRY_OPTIONS = [
  { value: 'TECNOLOGIA', label: 'Tecnología' },
  { value: 'SALUD', label: 'Salud' },
  { value: 'EDUCACION', label: 'Educación' },
  { value: 'CONSTRUCCION', label: 'Construcción' },
  { value: 'COMERCIO', label: 'Comercio' },
  { value: 'SERVICIOS_PROFESIONALES', label: 'Servicios profesionales' },
  { value: 'OTRO', label: 'Otro' },
];

export function FunnelLaborProfile({ dashboardMode = false }: FunnelLaborProfileProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    employment_status: '',
    industry: '',
    company: '',
    position: '',
    monthly_income: '',
    has_additional_income: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.employment_status) {
      newErrors.employment_status = 'Selecciona tu situación laboral';
    }
    if (!form.industry) {
      newErrors.industry = 'Selecciona el sector';
    }
    if (!form.monthly_income) {
      newErrors.monthly_income = 'Ingresa tu ingreso mensual';
    } else if (Number(form.monthly_income) < 500) {
      newErrors.monthly_income = 'El ingreso mínimo es S/ 500';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    const laborData: LaborData = {
      situation: form.employment_status,
      company: form.company,
      position: form.position,
      contractType: '',
      startDate: '',
      monthlyIncome: Number(form.monthly_income),
      hasAdditionalIncome: form.has_additional_income,
    };

    await saveLaborProfile(laborData);
    setLoading(false);

    if (dashboardMode) {
      router.push('/dashboard');
    } else {
      router.push('/funnel/economic');
    }
  };

  const content = (
    <>
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
            2
          </span>
          <p className="text-sm font-bold text-dark">Perfil laboral</p>
        </div>
        <p className="text-xs text-fondea-text pl-7">Cuéntanos sobre tu trabajo e ingresos</p>
      </div>

      <div className="p-5 space-y-5">
        {/* Situación laboral */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-dark">¿Cuál es tu situación laboral?</label>
          <select
            value={form.employment_status}
            onChange={(e) => {
              setForm({ ...form, employment_status: e.target.value });
              if (errors.employment_status) {
                const { employment_status, ...rest } = errors;
                setErrors(rest);
              }
            }}
            className="h-12 rounded-lg border border-border px-4 text-sm text-dark bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full"
          >
            <option value="">Selecciona una opción</option>
            {EMPLOYMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.employment_status && (
            <p className="text-xs text-error mt-0.5">{errors.employment_status}</p>
          )}
        </div>

        {/* Sector */}
        {form.employment_status && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-dark">Sector o industria</label>
            <select
              value={form.industry}
              onChange={(e) => {
                setForm({ ...form, industry: e.target.value });
                if (errors.industry) {
                  const { industry, ...rest } = errors;
                  setErrors(rest);
                }
              }}
              className="h-12 rounded-lg border border-border px-4 text-sm text-dark bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full"
            >
              <option value="">Selecciona una opción</option>
              {INDUSTRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.industry && (
              <p className="text-xs text-error mt-0.5">{errors.industry}</p>
            )}
          </div>
        )}

        {/* Empresa */}
        {form.employment_status === 'EMPLEADO_DEPENDIENTE' && (
          <Input
            label="Nombre de la empresa"
            placeholder="Ej: Banco Continental"
            value={form.company}
            onChange={(v) => setForm({ ...form, company: v })}
          />
        )}

        {/* Puesto */}
        {form.employment_status === 'EMPLEADO_DEPENDIENTE' && (
          <Input
            label="Puesto o cargo"
            placeholder="Ej: Analista"
            value={form.position}
            onChange={(v) => setForm({ ...form, position: v })}
          />
        )}

        {/* Ingreso mensual */}
        <Input
          label="Ingreso mensual neto (después de impuestos)"
          type="number"
          placeholder="S/ 0.00"
          value={form.monthly_income}
          onChange={(v) => {
            setForm({ ...form, monthly_income: v });
            if (errors.monthly_income) {
              const { monthly_income, ...rest } = errors;
              setErrors(rest);
            }
          }}
          error={errors.monthly_income}
          helperText="Promedio de los últimos 3 meses"
        />

        {/* Toggle ingresos adicionales */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-dark">¿Tienes ingresos adicionales?</span>
          <button
            type="button"
            onClick={() => setForm({ ...form, has_additional_income: !form.has_additional_income })}
            className={`w-11 h-6 rounded-full transition-all ${
              form.has_additional_income ? 'bg-primary' : 'bg-border'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow transition-all mx-0.5 ${
                form.has_additional_income ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {!dashboardMode && (
          <Button variant="primary" fullWidth loading={loading} onClick={handleSubmit}>
            Siguiente →
          </Button>
        )}
      </div>
    </>
  );

  if (dashboardMode) {
    return (
      <>
        <Card padding="none">{content}</Card>
        <StickyBottomBar
          ctaLabel="Guardar y volver al dashboard"
          onCta={handleSubmit}
          loading={loading}
        />
      </>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card padding="none">{content}</Card>
    </div>
  );
}
