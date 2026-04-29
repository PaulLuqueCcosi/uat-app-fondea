'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Briefcase, Pencil, CheckCircle2 } from 'lucide-react';
import { getCurrentStep } from '@/lib/funnel-steps';
import type { LaborProfileStatus, EmploymentStatus, AdditionalIncomeType, LaborIndustry, IncomeReceiptMethod } from '@/lib/types';
import {
  EMPLOYMENT_OPTIONS,
  INDUSTRY_OPTIONS,
  ADDITIONAL_INCOME_TYPE_OPTIONS,
  INCOME_RECEIPT_OPTIONS,
  LABOR_CONFIG,
} from '@/lib/constants';
import { saveLaborProfile } from '@/app/actions/labor.actions';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormHeader } from '@/components/ui/form-header';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { StickyBottomBar } from '@/components/ui/sticky-bottom-bar';

// ── Schema ────────────────────────────────────────────────────────────────────

const laborFormSchema = z.object({
  employment_status: z.string().min(1, 'Selecciona tu situación laboral'),
  industry: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  years_of_activity: z.string().optional(),
  business_ruc: z.string().optional(),
  monthly_income: z
    .string()
    .min(1, 'Ingresa tu ingreso mensual')
    .refine((val) => Number(val) >= LABOR_CONFIG.MIN_MONTHLY_INCOME, {
      message: `El ingreso mínimo es S/ ${LABOR_CONFIG.MIN_MONTHLY_INCOME}`,
    }),
  income_receipt_method: z.string().min(1, 'Selecciona cómo recibes tus ingresos'),
  has_additional_income: z.boolean(),
  additional_incomes: z.array(z.object({
    id: z.string(),
    type: z.string().min(1, 'Selecciona el tipo de ingreso'),
    custom_type: z.string().optional(),
    amount: z.string().min(1, 'Ingresa el monto'),
    description: z.string().optional(),
  })).optional(),
}).superRefine((data, ctx) => {
  // Sector requerido para todos excepto PENSIONISTA
  if (data.employment_status && data.employment_status !== 'PENSIONISTA' && !data.industry) {
    ctx.addIssue({ code: 'custom', message: 'Selecciona el sector', path: ['industry'] });
  }
  // Empresa y cargo — ya no son obligatorios para EMPLEADO_DEPENDIENTE
  // (solo se pide sector/industria en la sección de detalles)
  // Años de actividad para INDEPENDIENTE y FREELANCE
  if (['INDEPENDIENTE', 'FREELANCE'].includes(data.employment_status) && (data.years_of_activity === undefined || data.years_of_activity === '')) {
    ctx.addIssue({ code: 'custom', message: 'Ingresa los años de actividad', path: ['years_of_activity'] });
  }
  // Antigüedad para EMPLEADO_DEPENDIENTE (no negativos)
  if (data.employment_status === 'EMPLEADO_DEPENDIENTE') {
    if (data.years_of_activity === undefined || data.years_of_activity === '') {
      ctx.addIssue({ code: 'custom', message: 'Ingresa tu tiempo en la empresa', path: ['years_of_activity'] });
    } else if (Number(data.years_of_activity) < 0) {
      ctx.addIssue({ code: 'custom', message: 'El tiempo no puede ser negativo', path: ['years_of_activity'] });
    }
  }
  // Años + RUC para EMPRESARIO
  if (data.employment_status === 'EMPRESARIO') {
    if (data.years_of_activity === undefined || data.years_of_activity === '') {
      ctx.addIssue({ code: 'custom', message: 'Ingresa los años con tu negocio', path: ['years_of_activity'] });
    }
    if (!data.business_ruc) {
      ctx.addIssue({ code: 'custom', message: 'Ingresa el RUC del negocio', path: ['business_ruc'] });
    } else if (data.business_ruc.length !== LABOR_CONFIG.RUC_LENGTH) {
      ctx.addIssue({ code: 'custom', message: `El RUC debe tener ${LABOR_CONFIG.RUC_LENGTH} dígitos`, path: ['business_ruc'] });
    }
  }
  // Al menos un ingreso adicional si el switch está activo
  if (data.has_additional_income && (!data.additional_incomes || data.additional_incomes.length === 0)) {
    ctx.addIssue({ code: 'custom', message: 'Agrega al menos un ingreso adicional', path: ['has_additional_income'] });
  }
  // custom_type requerido cuando type === 'OTRO'
  if (data.additional_incomes) {
    data.additional_incomes.forEach((item, _i) => {
      if (item.type === 'OTRO' && !item.custom_type?.trim()) {
        ctx.addIssue({ code: 'custom', message: 'Especifica el tipo de ingreso', path: [`additional_incomes.${_i}.custom_type`] });
      }
    });
  }
});

type LaborFormValues = z.infer<typeof laborFormSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface LaborProfileProps {
  dashboardMode?: boolean;
  initialData?: LaborProfileStatus | null;
}

// ── Helpers UI ────────────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="font-semibold text-primary">{title}</h2>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value?: string | number | boolean }) {
  const display = value === undefined || value === null || value === ''
    ? '—'
    : typeof value === 'boolean'
      ? (value ? 'Sí' : 'No')
      : String(value);
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{display}</span>
    </div>
  );
}

function ButtonSpinner({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span role="status" aria-label="Cargando" className="block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
      <span>{label}</span>
    </span>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function FunnelLaborProfileShadcn({ dashboardMode = false, initialData }: LaborProfileProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentStep = getCurrentStep(pathname);

  const [isVerified, setIsVerified] = useState(initialData?.overall_verified === true);
  const [isEditing, setIsEditing] = useState(!initialData?.overall_verified);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Extraer datos previos de los 3 recursos
  const prevSituation = initialData?.situation;
  const prevDetails = initialData?.details;
  const prevIncome = initialData?.income;

  const form = useForm<LaborFormValues>({
    resolver: zodResolver(laborFormSchema),
    defaultValues: {
      employment_status: prevSituation?.employment_status ?? '',
      industry: prevDetails?.industry ?? '',
      company: prevDetails?.company ?? '',
      position: prevDetails?.position ?? '',
      years_of_activity: prevDetails?.years_of_activity ? String(prevDetails.years_of_activity) : '',
      business_ruc: prevDetails?.business_ruc ?? '',
      monthly_income: prevIncome?.monthly_income ? String(prevIncome.monthly_income) : '',
      income_receipt_method: prevIncome?.income_receipt_method ?? '',
      has_additional_income: prevIncome?.has_additional_income ?? false,
      additional_incomes: prevIncome?.additional_incomes?.map(i => ({
        id: i.id,
        type: i.type,
        custom_type: i.custom_type ?? '',
        amount: String(i.amount),
        description: i.description ?? '',
      })) ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'additional_incomes' });
  const employmentStatus = form.watch('employment_status');
  const hasAdditionalIncome = form.watch('has_additional_income');
  const isSubmitting = form.formState.isSubmitting;

  const handleEdit = () => {
    setIsVerified(false);
    setIsEditing(true);
    setSaveError(null);
  };

  // Cuando cambia el tipo de empleo, resetear campos de detalles del tipo anterior
  const handleEmploymentChange = (newValue: string, fieldOnChange: (v: string) => void) => {
    const prev = form.getValues('employment_status');
    if (prev && prev !== newValue) {
      form.setValue('industry', '');
      form.setValue('company', '');
      form.setValue('position', '');
      form.setValue('years_of_activity', '');
      form.setValue('business_ruc', '');
    }
    fieldOnChange(newValue);
  };

  const onSubmit = async (data: LaborFormValues) => {
    setSaveError(null);
    try {
      const result = await saveLaborProfile(
        data.employment_status as EmploymentStatus,
        {
          industry: data.industry as LaborIndustry,
          company: data.company || undefined,
          position: data.position || undefined,
          years_of_activity: data.years_of_activity ? Number(data.years_of_activity) : undefined,
          business_ruc: data.business_ruc || undefined,
        },
        {
          monthly_income: Number(data.monthly_income),
          income_receipt_method: data.income_receipt_method as IncomeReceiptMethod,
          has_additional_income: data.has_additional_income,
          additional_incomes: (data.has_additional_income ? data.additional_incomes ?? [] : []).map(i => ({
            id: i.id,
            type: i.type as AdditionalIncomeType,
            custom_type: i.type === 'OTRO' ? i.custom_type : undefined,
            amount: Number(i.amount),
            description: i.description || undefined,
          })),
        }
      );

      if (!result.success) {
        setSaveError(result.error || 'Error al guardar los datos.');
        return;
      }

      setIsVerified(true);
      setIsEditing(false);

      if (!dashboardMode) {
        router.push(currentStep?.nextPath || '/solicitar/economic');
      }
    } catch {
      setSaveError('Error de conexión. Por favor, inténtalo nuevamente.');
    }
  };

  // ── Vista readonly (datos guardados) ────────────────────────────────────────
  const employmentLabel = EMPLOYMENT_OPTIONS.find(o => o.value === prevSituation?.employment_status)?.label ?? '—';
  const industryLabel = INDUSTRY_OPTIONS.find(o => o.value === prevDetails?.industry)?.label ?? '—';
  const incomeReceiptLabel = INCOME_RECEIPT_OPTIONS.find(o => o.value === prevIncome?.income_receipt_method)?.label ?? '—';

  const verifiedView = (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-secondary">Perfil laboral guardado</p>
          <p className="text-xs text-muted-foreground">
            Tu información laboral está registrada. Puedes editarla si algo cambió.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleEdit} className="shrink-0 gap-1.5">
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
      </div>

      {/* Situación Laboral */}
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Situación Laboral</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DataRow label="Situación laboral" value={employmentLabel} />
          {prevSituation?.employment_status !== 'PENSIONISTA' && (
            <DataRow label="Sector" value={industryLabel} />
          )}
        </div>
      </div>

      {/* Detalles Laborales */}
      {prevSituation?.employment_status !== 'PENSIONISTA' && (
        <>
          <Separator className="bg-border h-px" />
          <div>
            <h3 className="text-sm font-semibold text-primary mb-3">Detalles Laborales</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {prevDetails?.company && (
                <DataRow label="Empresa" value={prevDetails.company} />
              )}
              {prevDetails?.position && (
                <DataRow label="Cargo" value={prevDetails.position} />
              )}
              {prevDetails?.years_of_activity !== undefined && (
                <DataRow
                  label={
                    prevSituation?.employment_status === 'EMPLEADO_DEPENDIENTE'
                      ? 'Tiempo en la empresa'
                      : prevSituation?.employment_status === 'EMPRESARIO'
                      ? 'Años con el negocio'
                      : 'Años de actividad'
                  }
                  value={`${prevDetails.years_of_activity} ${prevDetails.years_of_activity === 1 ? 'año' : 'años'}`}
                />
              )}
              {prevDetails?.business_ruc && (
                <DataRow label="RUC del negocio" value={prevDetails.business_ruc} />
              )}
            </div>
          </div>
        </>
      )}

      {/* Ingresos */}
      <Separator className="bg-border h-px" />
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Ingresos</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DataRow
            label="Ingreso mensual neto"
            value={`S/ ${Number(prevIncome?.monthly_income ?? 0).toLocaleString()}`}
          />
          <DataRow
            label="Cómo recibes tus ingresos"
            value={incomeReceiptLabel}
          />
          <DataRow
            label="¿Tienes ingresos adicionales?"
            value={prevIncome?.has_additional_income ? 'Sí' : 'No'}
          />
        </div>

        {prevIncome?.has_additional_income && prevIncome.additional_incomes && prevIncome.additional_incomes.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Detalle de ingresos adicionales:</p>
            <div className="space-y-2">
              {prevIncome.additional_incomes.map((inc) => {
                const typeLabel = ADDITIONAL_INCOME_TYPE_OPTIONS.find(o => o.value === inc.type)?.label ?? inc.type;
                const label = inc.type === 'OTRO' && inc.custom_type ? inc.custom_type : typeLabel;
                return (
                  <div key={inc.id} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2.5 bg-muted/30">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{label}</p>
                      {inc.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{inc.description}</p>
                      )}
                    </div>
                    <span className="font-semibold text-foreground ml-4">S/ {Number(inc.amount).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 p-3 bg-secondary/10 rounded-lg border border-secondary/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Ingreso total mensual</span>
                <span className="text-base font-bold text-secondary">
                  S/ {(
                    Number(prevIncome.monthly_income) +
                    prevIncome.additional_incomes.reduce((sum, inc) => sum + Number(inc.amount), 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {!dashboardMode && (
        <>
          <Separator className="bg-primary/20 h-px" />
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>Atrás</Button>
            <Button type="button" onClick={() => router.push(currentStep?.nextPath || '/solicitar/economic')}>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Continuar
              </span>
            </Button>
          </div>
        </>
      )}
    </div>
  );

  // ── Formulario editable ──────────────────────────────────────────────────────
  const editForm = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">

        {/* Situación laboral */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader title="Situación laboral" description="Selecciona tu condición laboral actual" />
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="employment_status"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>¿Cuál es tu situación laboral?</FormLabel>
                  <NativeSelect
                    {...field}
                    className="w-full"
                    onChange={(e) => handleEmploymentChange(e.target.value, field.onChange)}
                  >
                    <NativeSelectOption value="">Selecciona</NativeSelectOption>
                    {EMPLOYMENT_OPTIONS.map((opt) => (
                      <NativeSelectOption key={opt.value} value={opt.value}>{opt.label}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FormDescription>Tu condición laboral actual</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Detalles laborales — condicional según tipo */}
        {employmentStatus && employmentStatus !== 'PENSIONISTA' && (
          <>
            <Separator className="my-10 bg-primary/20 h-px" />
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              <SectionHeader title="Detalles laborales" description="Información sobre tu empleo" />
              <div className="space-y-8 md:col-span-2">

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-1">
                      <FormLabel>Sector o industria</FormLabel>
                      <NativeSelect {...field} className="w-full">
                        <NativeSelectOption value="">Selecciona</NativeSelectOption>
                        {INDUSTRY_OPTIONS.map((opt) => (
                          <NativeSelectOption key={opt.value} value={opt.value}>{opt.label}</NativeSelectOption>
                        ))}
                      </NativeSelect>
                      <FormDescription>El sector al que se dedica</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Años de actividad para EMPLEADO_DEPENDIENTE */}
                {employmentStatus === 'EMPLEADO_DEPENDIENTE' && (
                  <FormField
                    control={form.control}
                    name="years_of_activity"
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-start gap-1">
                        <FormLabel>Tiempo en la empresa</FormLabel>
                        <Input type="number" placeholder="2" {...field} className="w-full" min="0" step="0.1" />
                        <FormDescription>¿Cuántos años llevas en tu empresa actual?</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* EMPLEADO_DEPENDIENTE — solo sector, sin campos adicionales */}

                {/* Años de actividad — independiente y freelance */}
                {(employmentStatus === 'INDEPENDIENTE' || employmentStatus === 'FREELANCE') && (
                  <FormField
                    control={form.control}
                    name="years_of_activity"
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-start gap-1">
                        <FormLabel>Años con tu actividad</FormLabel>
                        <Input type="number" placeholder="3" {...field} className="w-full" min="0" />
                        <FormDescription>¿Cuántos años llevas en esta actividad?</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Años + RUC — empresario */}
                {employmentStatus === 'EMPRESARIO' && (
                  <>
                    <FormField
                      control={form.control}
                      name="years_of_activity"
                      render={({ field }) => (
                        <FormItem className="flex flex-col items-start gap-1">
                          <FormLabel>Años con tu negocio</FormLabel>
                          <Input type="number" placeholder="5" {...field} className="w-full" min="0" />
                          <FormDescription>¿Cuántos años tiene tu negocio?</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="business_ruc"
                      render={({ field }) => (
                        <FormItem className="flex flex-col items-start gap-1">
                          <FormLabel>RUC del negocio</FormLabel>
                          <Input
                            placeholder="20123456789"
                            {...field}
                            className="w-full font-mono"
                            maxLength={11}
                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                          />
                          <FormDescription>Número de RUC de tu empresa (11 dígitos)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Ingresos */}
        <Separator className="my-10 bg-primary/20 h-px" />
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader title="Ingresos" description="Información sobre tus ingresos actuales" />
          <div className="space-y-6 md:col-span-2">

            <FormField
              control={form.control}
              name="monthly_income"
              render={({ field }) => (
                <FormItem className="flex flex-col items-start gap-2">
                  <FormLabel>Ingreso mensual neto</FormLabel>
                  <div className="relative w-full">
                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-sm font-medium">S/</span>
                    </div>
                    <Input type="number" placeholder="0.00" {...field} className="w-full pl-10" min="0" step="0.01" />
                  </div>
                  <FormDescription>Después de impuestos (promedio últimos 3 meses)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="income_receipt_method"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>¿Cómo recibes tus ingresos?</FormLabel>
                  <NativeSelect {...field} className="w-full">
                    <NativeSelectOption value="">Selecciona</NativeSelectOption>
                    {INCOME_RECEIPT_OPTIONS.map((opt) => (
                      <NativeSelectOption key={opt.value} value={opt.value}>{opt.label}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FormDescription>Método principal de recepción de ingresos</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="has_additional_income"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>¿Tienes ingresos adicionales?</FormLabel>
                      <FormDescription>Otras fuentes de ingreso</FormDescription>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (!checked) form.setValue('additional_incomes', []);
                      }}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {hasAdditionalIncome && (
              <div className="space-y-6">
                {fields.map((field, index) => {
                  const watchedType = form.watch(`additional_incomes.${index}.type`);
                  return (
                  <div key={field.id} className="rounded-lg border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">Ingreso adicional #{index + 1}</h3>
                      <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Tipo de ingreso */}
                    <FormField
                      control={form.control}
                      name={`additional_incomes.${index}.type`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-1">
                          <FormLabel>Tipo de ingreso</FormLabel>
                          <NativeSelect {...field} className="w-full">
                            <NativeSelectOption value="">Selecciona</NativeSelectOption>
                            {ADDITIONAL_INCOME_TYPE_OPTIONS.map((opt) => (
                              <NativeSelectOption key={opt.value} value={opt.value}>{opt.label}</NativeSelectOption>
                            ))}
                          </NativeSelect>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Tipo personalizado — solo si eligió OTRO */}
                    {watchedType === 'OTRO' && (
                      <FormField
                        control={form.control}
                        name={`additional_incomes.${index}.custom_type`}
                        render={({ field }) => (
                          <FormItem className="flex flex-col gap-1">
                            <FormLabel>Especifica el tipo</FormLabel>
                            <Input placeholder="Ej: Comisiones, regalías..." {...field} className="w-full" />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Monto */}
                    <FormField
                      control={form.control}
                      name={`additional_incomes.${index}.amount`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-1">
                          <FormLabel>Monto mensual</FormLabel>
                          <div className="relative w-full">
                            <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <span className="text-sm font-medium">S/</span>
                            </div>
                            <Input type="number" placeholder="0.00" {...field} className="w-full pl-10" min="0" step="0.01" />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Descripción opcional */}
                    <FormField
                      control={form.control}
                      name={`additional_incomes.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-1">
                          <FormLabel>Descripción <span className="text-muted-foreground font-normal">(opcional)</span></FormLabel>
                          <Input placeholder="Ej: Departamento en Miraflores" {...field} className="w-full" />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  );
                })}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => append({
                    id: crypto.randomUUID(),
                    type: '',
                    custom_type: '',
                    amount: '',
                    description: '',
                  })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar ingreso adicional
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Error de guardado */}
        {saveError && (
          <>
            <Separator className="my-10 bg-primary/20 h-px" />
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">Error al guardar</p>
              <p className="text-sm text-destructive/80 mt-1">{saveError}</p>
            </div>
          </>
        )}

        <Separator className="my-10 bg-primary/20 h-px" />

        {/* Botones — solo en modo funnel */}
        {!dashboardMode && (
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => router.back()} disabled={isSubmitting}>
              Atrás
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? <ButtonSpinner label="Guardando..." /> : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Continuar
                </span>
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );

  // ── Contenido activo ──────────────────────────────────────────────────────────
  const content = isVerified && !isEditing ? verifiedView : editForm;

  if (dashboardMode) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="w-full">
          <CardContent className="pt-6">
            {content}
          </CardContent>
        </Card>
        {(!isVerified || isEditing) && (
          <StickyBottomBar
            ctaLabel={isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            onCta={form.handleSubmit(onSubmit)}
            loading={isSubmitting}
          />
        )}
      </div>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="pb-4">
        <FormHeader
          icon={currentStep?.icon || Briefcase}
          title="Perfil laboral"
          description={
            isVerified && !isEditing
              ? 'Tu información laboral está registrada'
              : 'Cuéntanos sobre tu trabajo e ingresos para evaluar tu solicitud'
          }
        />
      </CardHeader>
      <CardContent className="pt-0">{content}</CardContent>
    </Card>
  );
}
