'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Wallet, CheckCircle2 } from 'lucide-react';
import { getCurrentStep } from '@/lib/funnel-steps';
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
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { FormHeader } from '@/components/ui/form-header';
import { saveEconomicProfile } from '@/app/actions/economic.actions';
import type { EconomicSaveResult } from '@/app/actions/economic.actions';
import { LOAN_PURPOSE_OPTIONS, EDUCATION_LEVEL_OPTIONS } from '@/lib/constants';
import type { EconomicProfileStatus } from '@/lib/types';
import { useAutoNavigate } from '@/hooks/use-auto-navigate';
import { useFormErrorHandler } from '@/hooks/use-form-error-handler';
import { useFormEditControl } from '@/hooks/use-form-edit-control';
import { ContinueButton } from '@/components/ui/continue-button';
import { FormErrorFeedback } from '@/components/ui/form-error-feedback';
import { FormEditPolicyDialog } from '@/components/ui/form-edit-policy-dialog';
import { toast } from 'sonner';
import { DataRow } from '@/components/ui/data-row';
import { VerifiedBanner } from '@/components/ui/verified-banner';
import { AlertBanner } from '@/components/ui/alert-banner';

interface FunnelEconomicProfileProps {
  dashboardMode?: boolean;
  initialData?: EconomicProfileStatus;
  onClose?: () => void;
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

const FINANCIAL_ENTITIES = [
  { value: 'BCP', label: 'BCP' },
  { value: 'BBVA', label: 'BBVA' },
  { value: 'Interbank', label: 'Interbank' },
  { value: 'Scotiabank', label: 'Scotiabank' },
  { value: 'Banco de la Nación', label: 'Banco de la Nación' },
  { value: 'Banco Pichincha', label: 'Banco Pichincha' },
  { value: 'BanBif', label: 'BanBif' },
  // { value: 'Falabella', label: 'Falabella' },
  // { value: 'Ripley', label: 'Ripley' },
  // { value: 'Mibanco', label: 'Mibanco' },
  // { value: 'Caja Arequipa', label: 'Caja Arequipa' },
  // { value: 'Caja Huancayo', label: 'Caja Huancayo' },
  // { value: 'Caja Piura', label: 'Caja Piura' },
  // { value: 'Compartamos', label: 'Compartamos' },
  // { value: 'Crediscotia', label: 'Crediscotia' },
  // { value: 'Otro', label: 'Otro' },
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
  }).superRefine((debt, ctx) => {
    // Validar que la cuota mensual no sea mayor que el monto total
    const amount = Number(debt.amount);
    const monthlyPayment = Number(debt.monthly_payment);
    if (monthlyPayment > amount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La cuota mensual no puede ser mayor que el monto total',
        path: ['monthly_payment'],
      });
    }
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

// ── Componente auxiliar: spinner para botones ────────────────────────────────
function ButtonSpinner({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span role="status" aria-label="Cargando" className="block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
      <span>{label}</span>
    </span>
  );
}

export function FunnelEconomicProfileShadcn({ dashboardMode = false, initialData, onClose }: FunnelEconomicProfileProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentStep = getCurrentStep(pathname);

  // Hook centralizado de control de edición
  const editControl = useFormEditControl({
    editMetadata: initialData?.editMetadata,
    onEdit: () => errorHandler.clear(),
    onConfirmSubmit: () => form.handleSubmit(doSubmit)(),
  });

  // Hook centralizado de manejo de errores
  const errorHandler = useFormErrorHandler({
    moduleName: 'Perfil económico',
    dashboardMode,
  });

  // Datos guardados en este submit — tienen prioridad sobre initialData para el readonly
  const [savedProfile, setSavedProfile] = useState(initialData?.profile ?? null);

  // Status local — se actualiza después de submit exitoso
  const [localStatus, setLocalStatus] = useState(initialData?.status);
  const isExpired = localStatus === 'EXPIRED';

  const nextPath = currentStep?.nextPath || '/solicitar/references';
  const autoNavigate = useAutoNavigate(() => router.push(nextPath));

  const prevProfile = initialData?.profile;

  const isReplaced = initialData?.status === 'REPLACED';

  const form = useForm<EconomicFormValues>({
    resolver: zodResolver(economicFormSchema),
    defaultValues: {
      loan_purpose: isReplaced ? '' : (prevProfile?.loan_purpose || ''),
      monthly_expenses: isReplaced ? '' : (prevProfile?.monthly_expenses?.toString() || ''),
      has_debts: isReplaced ? false : (prevProfile?.has_debts || false),
      debts: isReplaced ? [] : (prevProfile?.debts?.map(d => ({
        entity: d.entity,
        type: d.type,
        amount: d.amount.toString(),
        monthly_payment: d.monthlyPayment.toString(),
      })) || []),
      has_property: isReplaced ? false : (prevProfile?.has_property || false),
      has_vehicle: isReplaced ? false : (prevProfile?.has_vehicle || false),
      has_services: isReplaced ? false : (prevProfile?.has_services || false),
      education_level: isReplaced ? '' : (prevProfile?.education_level || ''),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'debts',
  });

  const hasDebts = form.watch('has_debts');
  const isSubmitting = form.formState.isSubmitting;

  const handleEdit = () => {
    editControl.requestEdit();
  };

  const onSubmit = async (data: EconomicFormValues) => {
    if (!editControl.requestSubmit()) return;
    await doSubmit(data);
  };

  const doSubmit = async (data: EconomicFormValues) => {
    errorHandler.clear();

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

    const result = await errorHandler.execute(
      () => saveEconomicProfile(economicProfile),
      'Perfil económico guardado',
    );

    if (!result) return;

    // Guardar los datos para la vista readonly
    setSavedProfile({
      ...economicProfile,
      verified: true,
    });

    setLocalStatus('VERIFIED');
    editControl.confirmSaved();

    if (!dashboardMode) {
      router.push(nextPath);
    }
  };

  // ── Vista readonly (datos guardados) ────────────────────────────────────────
  const loanPurposeLabel = LOAN_PURPOSE_OPTIONS.find(o => o.value === savedProfile?.loan_purpose)?.label ?? '—';
  const educationLevelLabel = EDUCATION_LEVEL_OPTIONS.find(o => o.value === savedProfile?.education_level)?.label ?? '—';

  const verifiedView = (
    <div className="space-y-6">
      <VerifiedBanner
        title="Perfil económico guardado"
        description="Tu información económica está registrada. Puedes editarla si algo cambió."
        {...(editControl.canEdit ? { onEdit: handleEdit } : {})}
      />

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
            value={`S/ ${Number(savedProfile?.monthly_expenses ?? 0).toLocaleString()}`}
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
            value={savedProfile?.has_debts ? 'Sí' : 'No'}
          />
        </div>

        {savedProfile?.has_debts && savedProfile.debts && savedProfile.debts.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Detalle de deudas:</p>
            <div className="space-y-2">
              {savedProfile.debts.map((debt) => {
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
          <DataRow label="¿Eres propietario de algún inmueble?" value={savedProfile?.has_property} />
          <DataRow label="¿Tienes un vehículo a tu nombre?" value={savedProfile?.has_vehicle} />
          <DataRow label="¿Cuentas con servicios a tu nombre?" value={savedProfile?.has_services} />
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
            <ContinueButton
              onClick={autoNavigate.navigateNow}
              active={autoNavigate.active}
              progress={autoNavigate.progress}
              countdown={autoNavigate.countdown}
            />
          </div>
        </>
      )}
    </div>
  );

  // ── Banner de expirado (se muestra dentro del formulario) ────────────────
  const expiredBanner = isExpired && (
    <>
      <AlertBanner
        variant="warning"
        title="Tu verificación ha expirado"
        description="El tiempo de validez de tu verificación terminó. Revisa y corrige tus datos, luego vuelve a enviar para validar."
      />
      <Separator className="my-10 bg-primary/20 h-px" />
    </>
  );

  // ── Formulario editable ──────────────────────────────────────────────────────
  const editForm = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">

        {/* Banner de expirado */}
        {expiredBanner}

        {/* Error feedback centralizado */}
        <FormErrorFeedback handler={errorHandler} />

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
                  <FormLabel>¿Cómo vas a usar el dinero? *</FormLabel>
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
                  <FormLabel>Gastos mensuales totales *</FormLabel>
                  <div className="relative w-full">
                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-sm font-medium">S/</span>
                    </div>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              className="w-full pl-10"
                              min="0"
                              step="1"
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
                        } else if (fields.length === 0) {
                          // En formulario nuevo, agregar automáticamente la primera deuda
                          append({ entity: '', type: '', amount: '', monthly_payment: '' });
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
                          <FormLabel>Entidad financiera *</FormLabel>
                          <NativeSelect {...field} className="w-full">
                            <NativeSelectOption value="">Selecciona la entidad</NativeSelectOption>
                            {FINANCIAL_ENTITIES.map((opt) => (
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
                      name={`debts.${index}.type`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-1">
                          <FormLabel>Tipo de deuda *</FormLabel>
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
                          <FormLabel>Monto total *</FormLabel>
                          <div className="relative w-full">
                            <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <span className="text-sm font-medium">S/</span>
                            </div>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              className="w-full pl-10"
                              min="0"
                              step="1"
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
                          <FormLabel>Cuota mensual *</FormLabel>
                          <div className="relative w-full">
                            <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <span className="text-sm font-medium">S/</span>
                            </div>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              className="w-full pl-10"
                              min="0"
                              step="1"
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
                  <FormLabel>¿Cuál es tu grado de instrucción? *</FormLabel>
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
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          {editControl.isVerified ? (
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={dashboardMode && onClose ? onClose : () => { editControl.cancelEdit(); errorHandler.clear(); }} disabled={isSubmitting}>
              Cancelar
            </Button>
          ) : (
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={dashboardMode && onClose ? onClose : () => router.back()} disabled={isSubmitting}>
              {dashboardMode ? 'Cancelar' : 'Atrás'}
            </Button>
          )}
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={isSubmitting || errorHandler.state.blocked}
          >
            {isSubmitting ? <ButtonSpinner label="Guardando..." /> : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {editControl.isVerified ? 'Guardar cambios' : 'Continuar'}
              </span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );

  // ── Renderizado final ────────────────────────────────────────────────────────
  const content = editControl.isReadOnly ? verifiedView : editForm;

  if (dashboardMode) {
    return (
      <>
        <div className="max-w-3xl mx-auto">
          <Card className="w-full">
            <CardHeader className="pb-4">
              <FormHeader
                icon={Wallet}
                title="Perfil económico"
                description={
                  editControl.isReadOnly
                    ? 'Tu información económica está registrada'
                    : 'Cuéntanos sobre tus gastos y patrimonio'
                }
              />
            </CardHeader>
            <CardContent className="pt-0">
              {content}
            </CardContent>
          </Card>
        </div>

        <FormEditPolicyDialog {...editControl.dialogProps} />
      </>
    );
  }

  return (
    <>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="pb-4">
          <FormHeader
            icon={currentStep?.icon || Wallet}
            title="Perfil económico"
            description={
              editControl.isReadOnly
                ? 'Tu información económica está registrada'
                : isExpired
                ? 'Tu verificación ha expirado, debes validar nuevamente'
                : 'Cuéntanos sobre tu situación financiera para evaluar tu solicitud'
            }
          />
        </CardHeader>
        <CardContent className="pt-0">
          {content}
        </CardContent>
      </Card>

      <FormEditPolicyDialog {...editControl.dialogProps} />
    </>
  );
}
