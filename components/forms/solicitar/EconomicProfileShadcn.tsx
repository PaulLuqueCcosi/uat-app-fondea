'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Wallet, CheckCircle2 } from 'lucide-react';
import { getCurrentStep } from '@/lib/funnel-steps';
import { useState, useEffect } from 'react';

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
import { StickyBottomBar } from '@/components/ui/sticky-bottom-bar';
import { FormHeader } from '@/components/ui/form-header';
import { saveEconomicProfile } from '@/app/actions/economic.actions';
import type { EconomicSaveResult } from '@/app/actions/economic.actions';
import { LOAN_PURPOSE_OPTIONS, EDUCATION_LEVEL_OPTIONS } from '@/lib/constants';
import type { EconomicProfileStatus } from '@/lib/types';
import { useAutoNavigate } from '@/hooks/use-auto-navigate';
import { ContinueButton } from '@/components/ui/continue-button';
import { SaveErrorBanner } from '@/components/ui/save-error-banner';
import { DataRow } from '@/components/ui/data-row';
import { VerifiedBanner } from '@/components/ui/verified-banner';
import { AlertBanner } from '@/components/ui/alert-banner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

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

// ── Componente auxiliar: spinner para botones ────────────────────────────────
function ButtonSpinner({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span role="status" aria-label="Cargando" className="block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
      <span>{label}</span>
    </span>
  );
}

export function FunnelEconomicProfileShadcn({ dashboardMode = false, initialData }: FunnelEconomicProfileProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentStep = getCurrentStep(pathname);

  const [isVerified, setIsVerified] = useState(initialData?.overall_verified === true);
  const [isEditing, setIsEditing] = useState(!initialData?.overall_verified);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveErrorCategory, setSaveErrorCategory] = useState<import('@/lib/types').ErrorCategory | undefined>(undefined);
  const [blocked, setBlocked] = useState(false);
  const [blockedHoursLeft, setBlockedHoursLeft] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState<number | undefined>(undefined);
  const [maxAttempts, setMaxAttempts] = useState<number | undefined>(undefined);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [wasVerified, setWasVerified] = useState(initialData?.overall_verified === true);

  // Datos guardados en este submit — tienen prioridad sobre initialData para el readonly
  const [savedProfile, setSavedProfile] = useState(initialData?.profile ?? null);

  const currentStatus = initialData?.status;
  const isExpired = currentStatus === 'EXPIRED';

  // Forzar modo edición si está expirado
  useEffect(() => {
    if (isExpired && !isEditing) {
      setIsEditing(true);
    }
  }, [isExpired, isEditing]);

  const nextPath = currentStep?.nextPath || '/solicitar/references';
  const autoNavigate = useAutoNavigate(() => router.push(nextPath));

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
  const isSubmitting = form.formState.isSubmitting;

  const handleEdit = () => {
    if (isVerified) {
      setShowConfirmDialog(true);
      return;
    }
    setIsEditing(true);
    setSaveError(null);
    setSaveErrorCategory(undefined);
    setBlocked(false);
    setBlockedHoursLeft(0);
    setAttemptsLeft(undefined);
    setMaxAttempts(undefined);
  };

  const confirmEdit = () => {
    setShowConfirmDialog(false);
    setWasVerified(true);
    setIsVerified(false);
    setIsEditing(true);
    setSaveError(null);
    setSaveErrorCategory(undefined);
    setBlocked(false);
    setBlockedHoursLeft(0);
    setAttemptsLeft(undefined);
    setMaxAttempts(undefined);
  };

  const onSubmit = async (data: EconomicFormValues) => {
    setSaveError(null);
    setSaveErrorCategory(undefined);
    setBlocked(false);
    setBlockedHoursLeft(0);
    setAttemptsLeft(undefined);
    setMaxAttempts(undefined);

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

      const result: EconomicSaveResult = await saveEconomicProfile(economicProfile);

      if (!result.success) {
        if (result.errorCategory === 'rate_limit') {
          setBlocked(true);
          setBlockedHoursLeft(result.blockedHoursLeft ?? 24);
        }
        if (result.httpStatus === 422) {
          setAttemptsLeft(result.attemptsLeft);
          setMaxAttempts(result.maxAttempts);
        }
        setSaveError(result.error);
        setSaveErrorCategory(result.errorCategory);
        return;
      }

      // Guardar los datos para la vista readonly
      setSavedProfile({
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
        verified: true,
      });

      setIsVerified(true);
      setIsEditing(false);

      if (!dashboardMode) {
        autoNavigate.start();
      }
    } catch {
      setSaveError('Error de conexión. Por favor, inténtalo nuevamente.');
      setSaveErrorCategory('network');
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
        onEdit={handleEdit}
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

        {saveError && (
          <>
            <SaveErrorBanner
              error={saveError}
              errorCategory={saveErrorCategory}
            />
            <Separator className="my-10 bg-primary/20 h-px" />
          </>
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
                          <FormLabel>Cuota mensual</FormLabel>
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
            {wasVerified || isVerified ? (
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => { setIsVerified(true); setIsEditing(false); setWasVerified(true); setSaveError(null); }} disabled={isSubmitting}>
                Cancelar
              </Button>
            ) : (
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => router.back()} disabled={isSubmitting}>
                Atrás
              </Button>
            )}
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={isSubmitting || blocked}
            >
              {isSubmitting ? <ButtonSpinner label="Guardando..." /> : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {isVerified ? 'Guardar cambios' : 'Continuar'}
                </span>
              )}
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

        {/* Modal de confirmación al editar */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                ⚠️ ¿Editar perfil económico?
              </DialogTitle>
              <DialogDescription>
                Al editar, tu verificación actual se eliminará y deberás volver a validar tus datos.
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={confirmEdit}>
                Sí, editar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              isVerified && !isEditing
                ? 'Tu información económica está registrada'
                : isExpired && !isEditing
                ? 'Tu verificación ha expirado, debes validar nuevamente'
                : 'Cuéntanos sobre tu situación financiera para evaluar tu solicitud'
            }
          />
        </CardHeader>
        <CardContent className="pt-0">
          {content}
        </CardContent>
      </Card>

      {/* Modal de confirmación al editar */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              ⚠️ ¿Editar perfil económico?
            </DialogTitle>
            <DialogDescription>
              Al editar, tu verificación actual se eliminará y deberás volver a validar tus datos.
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmEdit}>
              Sí, editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
