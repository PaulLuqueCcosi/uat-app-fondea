'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Switch } from '@/components/ui/switch';
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

const laborFormSchema = z.object({
  employment_status: z.string().min(1, 'Selecciona tu situación laboral'),
  industry: z.string().min(1, 'Selecciona el sector'),
  company: z.string().optional(),
  position: z.string().optional(),
  monthly_income: z
    .string()
    .min(1, 'Ingresa tu ingreso mensual')
    .refine((val) => Number(val) >= 500, {
      message: 'El ingreso mínimo es S/ 500',
    }),
  has_additional_income: z.boolean(),
});

type LaborFormValues = z.infer<typeof laborFormSchema>;

export function FunnelLaborProfileShadcn({ dashboardMode = false }: FunnelLaborProfileProps) {
  const router = useRouter();

  const form = useForm<LaborFormValues>({
    resolver: zodResolver(laborFormSchema),
    defaultValues: {
      employment_status: '',
      industry: '',
      company: '',
      position: '',
      monthly_income: '',
      has_additional_income: false,
    },
  });

  const employmentStatus = form.watch('employment_status');

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
      router.push('/funnel/economic');
    }
  };

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
            2
          </span>
          <div>
            <h1 className="text-xl font-bold">Perfil laboral</h1>
            <p className="text-sm text-muted-foreground">Cuéntanos sobre tu trabajo e ingresos</p>
          </div>
        </div>

        {/* Card 1: Situación laboral */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Situación laboral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="employment_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>¿Cuál es tu situación laboral?</FormLabel>
                  <NativeSelect {...field} className="max-w-sm">
                    <NativeSelectOption value="">Selecciona una opción</NativeSelectOption>
                    {EMPLOYMENT_OPTIONS.map((opt) => (
                      <NativeSelectOption key={opt.value} value={opt.value}>
                        {opt.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FormMessage />
                </FormItem>
              )}
            />

              {/* Sector */}
            {employmentStatus && (
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sector o industria</FormLabel>
                    <NativeSelect {...field} className="max-w-sm">
                      <NativeSelectOption value="">Selecciona una opción</NativeSelectOption>
                      {INDUSTRY_OPTIONS.map((opt) => (
                        <NativeSelectOption key={opt.value} value={opt.value}>
                          {opt.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Card 2: Información de la empresa */}
        {employmentStatus === 'EMPLEADO_DEPENDIENTE' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información de la empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la empresa</FormLabel>
                    <Input placeholder="Ej: Banco Continental" className="max-w-sm" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puesto o cargo</FormLabel>
                    <Input placeholder="Ej: Analista" className="max-w-xs" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Card 3: Ingresos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingresos mensuales</CardTitle>
            <CardDescription>Información sobre tus ingresos actuales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="monthly_income"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingreso mensual neto</FormLabel>
                  <Input type="number" placeholder="S/ 0.00" className="max-w-xs" {...field} />
                  <FormDescription>Después de impuestos (promedio últimos 3 meses)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="has_additional_income"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Ingresos adicionales</FormLabel>
                    <FormDescription>¿Tienes otras fuentes de ingreso?</FormDescription>
                  </div>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Botón de envío */}
        {!dashboardMode && (
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Guardando...' : 'Continuar'}
          </Button>
        )}
      </form>
    </Form>
  );

  if (dashboardMode) {
    return (
      <>
        <div className="space-y-6">{content}</div>
        <StickyBottomBar
          ctaLabel="Guardar cambios"
          onCta={form.handleSubmit(onSubmit)}
          loading={form.formState.isSubmitting}
        />
      </>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {content}
    </div>
  );
}
