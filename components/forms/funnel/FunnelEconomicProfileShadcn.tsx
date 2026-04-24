'use client';

import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Wallet, TrendingUp, CreditCard, PiggyBank } from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { StickyBottomBar } from '@/components/ui/sticky-bottom-bar';
import { FormHeader } from '@/components/ui/form-header';
import { saveEconomicProfile } from '@/app/actions/loan.actions';

interface FunnelEconomicProfileProps {
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

const DEBT_TYPES = [
  { value: 'personal', label: 'Préstamo personal' },
  { value: 'credit_card', label: 'Tarjeta de crédito' },
  { value: 'mortgage', label: 'Hipotecario' },
  { value: 'auto', label: 'Vehicular' },
  { value: 'other', label: 'Otro' },
];

const economicFormSchema = z.object({
  monthly_expenses: z
    .string()
    .min(1, 'Ingresa tus gastos mensuales')
    .refine((val) => Number(val) >= 0, {
      message: 'Los gastos deben ser mayores o iguales a 0',
    }),
  has_debts: z.boolean(),
  debts: z.array(z.object({
    entity: z.string().min(1, 'Ingresa la entidad'),
    type: z.string().min(1, 'Selecciona el tipo'),
    amount: z.string().min(1, 'Ingresa el monto'),
    monthly_payment: z.string().min(1, 'Ingresa la cuota mensual'),
  })).optional(),
  has_property: z.boolean(),
  has_vehicle: z.boolean(),
}).superRefine((data, ctx) => {
  // Validar que si tiene deudas, debe agregar al menos una
  if (data.has_debts && (!data.debts || data.debts.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debes agregar al menos una deuda',
      path: ['has_debts'],
    });
  }
});

type EconomicFormValues = z.infer<typeof economicFormSchema>;

export function FunnelEconomicProfileShadcn({ dashboardMode = false }: FunnelEconomicProfileProps) {
  const router = useRouter();

  const form = useForm<EconomicFormValues>({
    resolver: zodResolver(economicFormSchema),
    defaultValues: {
      monthly_expenses: '',
      has_debts: false,
      debts: [],
      has_property: false,
      has_vehicle: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'debts',
  });

  const hasDebts = form.watch('has_debts');

  const onSubmit = async (data: EconomicFormValues) => {
    const economicData = {
      monthlyIncome: 0, // Se obtiene del formulario laboral
      otherIncome: 0,
      monthlyExpenses: Number(data.monthly_expenses),
      hasDebts: data.has_debts,
      debts: data.debts?.map(debt => ({
        id: Date.now().toString() + Math.random(),
        entity: debt.entity,
        type: debt.type,
        amount: Number(debt.amount),
        monthlyPayment: Number(debt.monthly_payment),
      })) || [],
      hasProperty: data.has_property,
      hasVehicle: data.has_vehicle,
      hasSavings: false,
      savingsAmount: 0,
    };

    await saveEconomicProfile(economicData);

    if (dashboardMode) {
      router.push('/dashboard');
    } else {
      router.push('/funnel/references');
    }
  };

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        {/* Sección 1: Gastos */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader
            title="Gastos mensuales"
            description="Tus gastos mensuales totales"
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="monthly_expenses"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>Gastos mensuales totales</FormLabel>
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
                  <FormDescription>Incluye alimentación, transporte, servicios, etc.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Sección 2: Deudas */}
        <Separator className="my-10 bg-primary/20 h-px" />
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader
            title="Deudas"
            description="Información sobre tus deudas actuales"
          />

          <div className="space-y-8 md:col-span-2">
            <FormField
              control={form.control}
              name="has_debts"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>¿Tienes deudas actualmente?</FormLabel>
                      <FormDescription>Préstamos, tarjetas de crédito, etc.</FormDescription>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (!checked) {
                          form.setValue('debts', []);
                        }
                      }}
                    />
                  </div>
                </FormItem>
              )}
            />

            {hasDebts && (
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">Deuda #{index + 1}</h3>
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
                      name={`debts.${index}.entity`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-1">
                          <FormLabel>Entidad</FormLabel>
                          <Input placeholder="Banco BCP" {...field} className="w-full" />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`debts.${index}.type`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-1">
                          <FormLabel>Tipo de deuda</FormLabel>
                          <NativeSelect {...field} className="w-full">
                            <NativeSelectOption value="">Selecciona</NativeSelectOption>
                            {DEBT_TYPES.map((opt) => (
                              <NativeSelectOption key={opt.value} value={opt.value}>
                                {opt.label}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`debts.${index}.amount`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-1">
                          <FormLabel>Monto total</FormLabel>
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
                      name={`debts.${index}.monthly_payment`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-1">
                          <FormLabel>Cuota mensual</FormLabel>
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
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => append({ entity: '', type: '', amount: '', monthly_payment: '' })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar otra deuda
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Sección 3: Patrimonio */}
        <Separator className="my-10 bg-primary/20 h-px" />
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader
            title="Patrimonio"
            description="Información sobre tus bienes"
          />

          <div className="space-y-8 md:col-span-2">
            <FormField
              control={form.control}
              name="has_property"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>¿Eres propietario de algún inmueble?</FormLabel>
                      <FormDescription>Casa, departamento, terreno, etc.</FormDescription>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="has_vehicle"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>¿Tienes un vehículo a tu nombre?</FormLabel>
                      <FormDescription>Auto, moto, camioneta, etc.</FormDescription>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="my-10 bg-primary/20 h-px" />

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
          icon={Wallet}
          title="Perfil económico"
          description="Cuéntanos sobre tu situación financiera para evaluar tu solicitud"
        />
      </CardHeader>
      <CardContent className="pt-0">
        {content}
      </CardContent>
    </Card>
  );
}
