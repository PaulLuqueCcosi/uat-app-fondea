'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Briefcase } from 'lucide-react';
import { getCurrentStep } from '@/lib/funnel-steps';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Form,
  FormControl,
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
import { saveLaborProfile } from '@/app/actions/loan.actions';
import type { LaborData } from '@/lib/types';

interface FunnelLaborProfileProps {
  dashboardMode?: boolean;
}

interface SectionHeaderProps {
  title: string;
  description: string;
}

function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="space-y-1">
      <h2 className="font-semibold text-primary">{title}</h2>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
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
    .refine((val) => Number(val) >= 500, {
      message: 'El ingreso mínimo es S/ 500',
    }),
  has_additional_income: z.boolean(),
  additional_incomes: z.array(z.object({
    amount: z.string().min(1, 'Ingresa el monto'),
    source: z.string().min(1, 'Ingresa la fuente'),
  })).optional(),
}).superRefine((data, ctx) => {
  // Validar que industry sea requerido si hay employment_status
  if (data.employment_status && !data.industry) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecciona el sector',
      path: ['industry'],
    });
  }

  // Validar years_of_activity para INDEPENDIENTE
  if (data.employment_status === 'INDEPENDIENTE' && !data.years_of_activity) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Ingresa los años de actividad',
      path: ['years_of_activity'],
    });
  }

  // Validar years_of_activity y business_ruc para EMPRESARIO
  if (data.employment_status === 'EMPRESARIO') {
    if (!data.years_of_activity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ingresa los años con tu negocio',
        path: ['years_of_activity'],
      });
    }
    if (!data.business_ruc) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ingresa el RUC del negocio',
        path: ['business_ruc'],
      });
    } else if (data.business_ruc.length !== 11) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El RUC debe tener 11 dígitos',
        path: ['business_ruc'],
      });
    }
  }

  // Validar que si tiene ingresos adicionales, debe agregar al menos uno
  if (data.has_additional_income && (!data.additional_incomes || data.additional_incomes.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debes agregar al menos un ingreso adicional',
      path: ['has_additional_income'],
    });
  }
});

type LaborFormValues = z.infer<typeof laborFormSchema>;

export function FunnelLaborProfileShadcn({ dashboardMode = false }: FunnelLaborProfileProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentStep = getCurrentStep(pathname);

  const form = useForm<LaborFormValues>({
    resolver: zodResolver(laborFormSchema),
    defaultValues: {
      employment_status: '',
      industry: '',
      company: '',
      position: '',
      years_of_activity: '',
      business_ruc: '',
      monthly_income: '',
      has_additional_income: false,
      additional_incomes: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'additional_incomes',
  });

  const employmentStatus = form.watch('employment_status');
  const hasAdditionalIncome = form.watch('has_additional_income');

  const onSubmit = async (data: LaborFormValues) => {
    const laborData: LaborData = {
      situation: data.employment_status,
      company: data.company || '',
      position: data.position || '',
      contractType: '',
      startDate: '',
      monthlyIncome: Number(data.monthly_income),
      hasAdditionalIncome: data.has_additional_income,
    };

    await saveLaborProfile(laborData);

    if (dashboardMode) {
      router.push('/dashboard');
    } else {
      router.push(currentStep?.nextPath || '/solicitar/economic');
    }
  };

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        {/* Sección 1: Situación laboral */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader
            title="Situación laboral"
            description="Selecciona tu condición laboral actual"
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="employment_status"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>¿Cuál es tu situación laboral?</FormLabel>
                  <NativeSelect {...field} className="w-full">
                    <NativeSelectOption value="">Selecciona</NativeSelectOption>
                    {EMPLOYMENT_OPTIONS.map((opt) => (
                      <NativeSelectOption key={opt.value} value={opt.value}>
                        {opt.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FormDescription>Tu condición laboral actual</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Sección 2: Detalles laborales (condicional) */}
        {employmentStatus && (
          <>
            <Separator className="my-10 bg-primary/20 h-px" />
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              <SectionHeader
                title="Detalles laborales"
                description="Información sobre tu empleo"
              />

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
                          <NativeSelectOption key={opt.value} value={opt.value}>
                            {opt.label}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                      <FormDescription>El sector al que se dedica</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {employmentStatus === 'INDEPENDIENTE' && (
                  <FormField
                    control={form.control}
                    name="years_of_activity"
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-start gap-1">
                        <FormLabel>Años con tu actividad</FormLabel>
                        <Input type="number" placeholder="3" {...field} className="w-full" min="0" />
                        <FormDescription>¿Cuántos años llevas como trabajador independiente?</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

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
                          <Input placeholder="20123456789" {...field} className="w-full" maxLength={11} />
                          <FormDescription>Número de RUC de tu empresa</FormDescription>
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

        {/* Sección 3: Ingresos */}
        <Separator className="my-10 bg-primary/20 h-px" />
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader
            title="Ingresos"
            description="Información sobre tus ingresos actuales"
          />

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
                    <Input
                      type="number"
                      placeholder="0.00"
                      {...field}
                      className="w-full pl-10"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <FormDescription>Después de impuestos (promedio últimos 3 meses)</FormDescription>
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
                        if (!checked) {
                          form.setValue('additional_incomes', []);
                        }
                      }}
                    />
                  </div>
                </FormItem>
              )}
            />

            {hasAdditionalIncome && (
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">Ingreso adicional #{index + 1}</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

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
                            <Input
                              type="number"
                              placeholder="0.00"
                              {...field}
                              className="w-full pl-10"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`additional_incomes.${index}.source`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-1">
                          <FormLabel>Fuente</FormLabel>
                          <Input placeholder="Alquiler" {...field} className="w-full" />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => append({ amount: '', source: '' })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar ingreso adicional
                </Button>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-10" />

        {/* Botones de acción */}
        {!dashboardMode && (
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => router.back()}>
              Atrás
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Guardando...' : 'Continuar'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );

  if (dashboardMode) {
    return (
      <>
        {content}
        <StickyBottomBar
          ctaLabel="Guardar cambios"
          onCta={form.handleSubmit(onSubmit)}
          loading={form.formState.isSubmitting}
        />
      </>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="pb-4">
        <FormHeader
          icon={currentStep?.icon || Briefcase}
          title="Perfil laboral"
          description="Cuéntanos sobre tu trabajo e ingresos para evaluar tu solicitud"
        />
      </CardHeader>
      <CardContent className="pt-0">
        {content}
      </CardContent>
    </Card>
  );
}
