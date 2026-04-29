'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Wallet, TrendingUp, CreditCard, PiggyBank, Pencil, CheckCircle2 } from 'lucide-react';
import { getCurrentStep } from '@/lib/funnel-steps';
import { useState } from 'react';

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
import { saveEconomicProfile } from '@/app/actions/economic.actions';
import { LOAN_PURPOSE_OPTIONS, EDUCATION_LEVEL_OPTIONS } from '@/lib/constants';
import { EconomicProfileStatus } from '@/lib/types';

interface FunnelEconomicProfileProps {
  dashboardMode?: boolean;
  initialData?: EconomicProfileStatus;
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

const DEBT_TYPES = [
  { value: 'personal', label: 'Préstamo personal' },
  { value: 'credit_card', label: 'Tarjeta de crédito' },
  { value: 'mortgage', label: 'Hipotecario' },
  { value: 'auto', label: 'Vehicular' },
  { value: 'other', label: 'Otro' },
];

const economicFormSchema = z.object({
  loan_purpose: z.string().min(1, 'Selecciona para qué usarás el dinero'),
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
  has_services: z.boolean(),
  education_level: z.string().min(1, 'Selecciona tu grado de instrucción'),
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

export function FunnelEconomicProfileShadcn({ dashboardMode = false, initialData }: FunnelEconomicProfileProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentStep = getCurrentStep(pathname);

  const [isVerified, setIsVerified] = useState(initialData?.overall_verified === true);
  const [isEditing, setIsEditing] = useState(!initialData?.overall_verified);
  const [saveError, setSaveError] = useState<string | null>(null);

  const prevProfile = initialData?.profile;

  const form = useForm<EconomicFormValues>({
    resolver: zodResolver(economicFormSchema),
    defaultValues: {
      loan_purpose: prevProfile?.loan_purpose || '',
      monthly_expenses: prevProfile?.monthly_expenses?.toString() || '',
      has_debts: prevProfile?.has_debts || false,
      debts: prevProfile?.debts?.map(d => ({
        entity: d.entity,
        type: d.type,
        amount: d.amount.toString(),
        monthly_payment: d.monthlyPayment.toString(),
      })) || [],
      has_property: prevProfile?.has_property || false,
      has_vehicle: prevProfile?.has_vehicle || false,
      has_services: prevProfile?.has_services || false,
      education_level: prevProfile?.education_level || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'debts',
  });

  const hasDebts = form.watch('has_debts');

  const handleEdit = () => {
    setIsVerified(false);
    setIsEditing(true);
    setSaveError(null);
  };

  const onSubmit = async (data: EconomicFormValues) => {
    setSaveError(null);
    try {
      const economicProfile = {
        loan_purpose: data.loan_purpose as any,
        monthly_expenses: Number(data.monthly_expenses),
        has_debts: data.has_debts,
        debts: data.has_debts ? data.debts?.map(debt => ({
          id: debt.entity + '-' + Date.now(),
          entity: debt.entity,
          type: debt.type,
          amount: Number(debt.amount),
          monthlyPayment: Number(debt.monthly_payment),
        })) || [] : [],
        has_property: data.has_property,
        has_vehicle: data.has_vehicle,
        has_services: data.has_services,
        education_level: data.education_level as any,
      };

      const result = await saveEconomicProfile(economicProfile);

      if (!result.success) {
        setSaveError(result.error || 'Error al guardar los datos.');
        return;
      }

      setIsVerified(true);
      setIsEditing(false);

      if (!dashboardMode) {
        router.push(currentStep?.nextPath || '/solicitar/references');
      }
    } catch {
      setSaveError('Error de conexión. Por favor, inténtalo nuevamente.');
    }
  };

  // ── Vista readonly (datos guardados) ────────────────────────────────────────
  const loanPurposeLabel = LOAN_PURPOSE_OPTIONS.find(o => o.value === prevProfile?.loan_purpose)?.label ?? '—';
  const educationLevelLabel = EDUCATION_LEVEL_OPTIONS.find(o => o.value === prevProfile?.education_level)?.label ?? '—';

  const verifiedView = (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-secondary">Perfil económico guardado</p>
          <p className="text-xs text-muted-foreground">
            Tu información económica está registrada. Puedes editarla si algo cambió.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleEdit} className="shrink-0 gap-1.5">
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
      </div>

      {/* Propósito del préstamo */}
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Propósito del préstamo</h3>
        <div className="grid grid-cols-1 gap-4">
          <DataRow label="¿Para qué usarás el dinero?" value={loanPurposeLabel} />
        </div>
      </div>

      {/* Gastos */}
      <Separator className="bg-border h-px" />
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Gastos mensuales</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DataRow
            label="Gastos mensuales totales"
            value={`S/ ${Number(prevProfile?.monthly_expenses ?? 0).toLocaleString()}`}
          />
        </div>
      </div>

      {/* Deudas */}
      <Separator className="bg-border h-px" />
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Deudas</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DataRow
            label="¿Tienes deudas actualmente?"
            value={prevProfile?.has_debts ? 'Sí' : 'No'}
          />
        </div>

        {prevProfile?.has_debts && prevProfile.debts && prevProfile.debts.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Detalle de deudas:</p>
            <div className="space-y-2">
              {prevProfile.debts.map((debt) => {
                const debtTypeLabel = DEBT_TYPES.find(o => o.value === debt.type)?.label ?? debt.type;
                return (
                  <div key={debt.id} className="border rounded-lg px-3 py-2.5 bg-muted/30">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{debt.entity}</p>
                        <p className="text-xs text-muted-foreground">{debtTypeLabel}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Monto total:</span>
                        <span className="font-semibold text-foreground ml-1">S/ {Number(debt.amount).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cuota mensual:</span>
                        <span className="font-semibold text-foreground ml-1">S/ {Number(debt.monthlyPayment).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Patrimonio */}
      <Separator className="bg-border h-px" />
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Patrimonio</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DataRow label="¿Eres propietario de algún inmueble?" value={prevProfile?.has_property} />
          <DataRow label="¿Tienes un vehículo a tu nombre?" value={prevProfile?.has_vehicle} />
          <DataRow label="¿Cuentas con servicios a tu nombre?" value={prevProfile?.has_services} />
        </div>
      </div>

      {/* Educación */}
      <Separator className="bg-border h-px" />
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Grado de instrucción</h3>
        <div className="grid grid-cols-1 gap-4">
          <DataRow label="¿Cuál es tu grado de instrucción?" value={educationLevelLabel} />
        </div>
      </div>

      {!dashboardMode && (
        <>
          <Separator className="bg-primary/20 h-px" />
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>Atrás</Button>
            <Button type="button" onClick={() => router.push(currentStep?.nextPath || '/solicitar/references')}>
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
        {saveError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-800">{saveError}</p>
          </div>
        )}

        {/* Sección 0: Propósito del préstamo */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader
            title="Propósito del préstamo"
            description="¿Para qué necesitas el dinero?"
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="loan_purpose"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>¿Cómo vas a usar el dinero?</FormLabel>
                  <NativeSelect {...field} className="w-full">
                    <NativeSelectOption value="">Selecciona una opción</NativeSelectOption>
                    {LOAN_PURPOSE_OPTIONS.map((opt) => (
                      <NativeSelectOption key={opt.value} value={opt.value}>
                        {opt.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FormDescription>Esto nos ayuda a entender mejor tu necesidad</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="my-10 bg-primary/20 h-px" />

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

            <FormField
              control={form.control}
              name="has_services"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>¿Cuentas con servicios a tu nombre?</FormLabel>
                      <FormDescription>Luz, agua, celular postpago, etc.</FormDescription>
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

        {/* Sección 4: Educación */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader
            title="Grado de instrucción"
            description="Tu nivel educativo alcanzado"
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="education_level"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>¿Cuál es tu grado de instrucción?</FormLabel>
                  <NativeSelect {...field} className="w-full">
                    <NativeSelectOption value="">Selecciona una opción</NativeSelectOption>
                    {EDUCATION_LEVEL_OPTIONS.map((opt) => (
                      <NativeSelectOption key={opt.value} value={opt.value}>
                        {opt.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FormDescription>Tu nivel educativo más alto completado</FormDescription>
                  <FormMessage />
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

  // ── Renderizado final ────────────────────────────────────────────────────────
  const content = isVerified && !isEditing ? verifiedView : editForm;

  if (dashboardMode) {
    return (
      <>
        {content}
        {isEditing && (
          <StickyBottomBar
            ctaLabel="Guardar cambios"
            onCta={form.handleSubmit(onSubmit)}
            loading={form.formState.isSubmitting}
          />
        )}
      </>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="pb-4">
        <FormHeader
          icon={currentStep?.icon || Wallet}
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
