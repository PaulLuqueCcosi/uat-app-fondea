'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, Wallet, CreditCard, Eye, EyeOff } from 'lucide-react';
import { getCurrentStep } from '@/lib/funnel-steps';
import { useState } from 'react';
import { BankAccountProfileStatus } from '@/lib/types';

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
import { Separator } from '@/components/ui/separator';
import { StickyBottomBar } from '@/components/ui/sticky-bottom-bar';
import { FormHeader } from '@/components/ui/form-header';
import { saveBankAccountProfile } from '@/app/actions/bank-account.actions';
import type { BankAccountSaveResult } from '@/app/actions/bank-account.actions';
import { useAutoNavigate } from '@/hooks/use-auto-navigate';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { ContinueButton } from '@/components/ui/continue-button';
import { DataRow } from '@/components/ui/data-row';
import { VerifiedBanner } from '@/components/ui/verified-banner';
import { SaveErrorBanner } from '@/components/ui/save-error-banner';

interface FunnelBankAccountProps {
  dashboardMode?: boolean;
  initialData?: BankAccountProfileStatus;
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

const BANKS = [
  { value: 'BCP', label: 'BCP' },
  { value: 'BBVA', label: 'BBVA' },
  { value: 'Interbank', label: 'Interbank' },
  { value: 'Scotiabank', label: 'Scotiabank' },
  { value: 'Banco de la Nación', label: 'Banco de la Nación' },
  { value: 'Banco Pichincha', label: 'Banco Pichincha' },
  { value: 'BanBif', label: 'BanBif' },
  { value: 'Falabella', label: 'Falabella' },
  { value: 'Ripley', label: 'Ripley' },
  { value: 'Otro', label: 'Otro' },
];

const ACCOUNT_TYPES = [
  { value: 'AHORROS', label: 'Cuenta de ahorros' },
  { value: 'CORRIENTE', label: 'Cuenta corriente' },
];

const bankAccountFormSchema = z.object({
  bank: z.string().min(1, 'Selecciona tu banco'),
  account_type: z.string().min(1, 'Selecciona el tipo de cuenta'),
  cci: z
    .string()
    .length(20, 'El CCI debe tener exactamente 20 dígitos')
    .regex(/^\d+$/, 'Solo se permiten números'),
});

type BankAccountFormValues = z.infer<typeof bankAccountFormSchema>;

export function FunnelBankAccountShadcn({ dashboardMode = false, initialData }: FunnelBankAccountProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentStep = getCurrentStep(pathname);
  const [showCCI, setShowCCI] = useState(false);
  /** Módulo bloqueado por max intentos de validación de CCI */
  const [blocked, setBlocked] = useState(false);
  const [blockedHoursLeft, setBlockedHoursLeft] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState<number | undefined>(undefined);

  const {
    isVerified,
    isEditing,
    isFirstTime,
    saveError,
    saveErrorCategory,
    savedData,
    handleSubmit: submitForm,
    startEditing,
    cancelEditing,
  } = useFormSubmission(
    async (data: BankAccountFormValues) => {
      const bankAccountProfile = {
        bank: data.bank,
        account_type: data.account_type as 'AHORROS' | 'CORRIENTE',
        cci: data.cci,
      };
      const result = await saveBankAccountProfile(bankAccountProfile);

      // Manejar campos extendidos (attemptsLeft, blockedHoursLeft)
      if (!result.success) {
        if (result.errorCategory === 'rate_limit') {
          setBlocked(true);
          setBlockedHoursLeft(result.blockedHoursLeft ?? 24);
        }
        if (result.attemptsLeft !== undefined) {
          setAttemptsLeft(result.attemptsLeft);
        }
      }

      return result;
    },
    {
      initialVerified: initialData?.overall_verified,
      initialData: initialData?.profile,
    },
  );

  const nextPath = currentStep?.nextPath || '/solicitar/summary';
  const autoNavigate = useAutoNavigate(() => router.push(nextPath));

  const prevProfile = initialData?.profile;

  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountFormSchema),
    defaultValues: {
      bank: prevProfile?.bank || '',
      account_type: prevProfile?.account_type || '',
      cci: prevProfile?.cci || '',
    },
  });

  const onSubmit = async (data: BankAccountFormValues) => {
    const success = await submitForm(data);
    if (success && !dashboardMode) {
      autoNavigate.start();
    }
  };

  // ── Vista readonly (datos guardados) ────────────────────────────────────────
  const bankLabel = BANKS.find(b => b.value === savedData?.bank)?.label ?? savedData?.bank ?? '—';
  const accountTypeLabel = ACCOUNT_TYPES.find(t => t.value === savedData?.account_type)?.label ?? '—';

  const maskedCCI = savedData?.cci ? '****' + savedData.cci.slice(-4) : '—';
  const displayCCI = showCCI ? savedData?.cci : maskedCCI;

  const verifiedView = (
    <div className="space-y-6">
      <VerifiedBanner
        title="Cuenta bancaria guardada"
        description="Tu cuenta para el desembolso está registrada. Puedes editarla si algo cambió."
        onEdit={startEditing}
      />

      {/* Info importante */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <p className="text-sm text-foreground">
          La cuenta debe estar a tu nombre y debe ser una cuenta en soles.
        </p>
      </div>

      {/* Datos bancarios */}
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Datos bancarios</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DataRow label="Banco" value={bankLabel} />
          <DataRow label="Tipo de cuenta" value={accountTypeLabel} />
          <div className="sm:col-span-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">CCI</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground font-mono">{displayCCI}</span>
                <button
                  type="button"
                  onClick={() => setShowCCI(!showCCI)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                  aria-label={showCCI ? 'Ocultar CCI' : 'Mostrar CCI'}
                >
                  {showCCI ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
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

  // ── Formulario editable ──────────────────────────────────────────────────────
  const editForm = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        {saveError && (
          <SaveErrorBanner
            error={saveError}
            errorCategory={saveErrorCategory}
          />
        )}

        {/* Info importante */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-10">
          <p className="text-sm text-foreground">
            La cuenta debe estar a tu nombre y debe ser una cuenta en soles.
          </p>
        </div>

        {/* Sección: Datos bancarios */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader
            title="Datos bancarios"
            description="Para recibir el desembolso"
          />

          <div className="space-y-8 md:col-span-2">
            <FormField
              control={form.control}
              name="bank"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>Banco</FormLabel>
                  <NativeSelect {...field} className="w-full">
                    <NativeSelectOption value="">Selecciona tu banco</NativeSelectOption>
                    {BANKS.map((opt) => (
                      <NativeSelectOption key={opt.value} value={opt.value}>
                        {opt.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FormDescription>El banco donde tienes tu cuenta</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="account_type"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>Tipo de cuenta</FormLabel>
                  <NativeSelect {...field} className="w-full">
                    <NativeSelectOption value="">Selecciona el tipo</NativeSelectOption>
                    {ACCOUNT_TYPES.map((opt) => (
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
              name="cci"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>Código de Cuenta Interbancario (CCI)</FormLabel>
                  <Input
                    placeholder="00212345678901234567"
                    {...field}
                    className="w-full"
                    maxLength={20}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 20);
                      field.onChange(cleaned);
                    }}
                  />
                  <FormDescription>20 dígitos que identifican tu cuenta</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Info sobre CCI */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <p className="text-xs text-muted-foreground">
                <strong>¿Dónde encuentro mi CCI?</strong> Lo puedes encontrar en tu app bancaria,
                banca por internet, o solicitándolo en una agencia. Es un código de 20 dígitos.
              </p>
            </div>
          </div>
        </div>

        {/* Panel de bloqueo/intentos — aparece cuando hay error de validación de CCI */}
        {(blocked || (saveError && attemptsLeft !== undefined)) && (
          <>
            <Separator className="my-10 bg-primary/20 h-px" />
            <div className={`rounded-lg border p-4 ${blocked ? 'border-error-200 bg-error-50' : attemptsLeft === 1 ? 'border-error-200 bg-error-50' : 'border-warning-200 bg-warning-50'}`}>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-lg">
                  {blocked ? '🔒' : attemptsLeft === 1 ? '🚨' : '⚠️'}
                </span>
                <div className="space-y-2 w-full">
                  {blocked && (
                    <div>
                      <p className="text-sm font-semibold text-error-700">
                        Módulo bloqueado por {blockedHoursLeft} hora{blockedHoursLeft !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-error-600 mt-1">
                        Has superado el número máximo de intentos. Podrás intentarlo nuevamente cuando expire el bloqueo.
                      </p>
                    </div>
                  )}
                  {!blocked && attemptsLeft !== undefined && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Intentos restantes</span>
                        <span className={`font-bold ${attemptsLeft === 1 ? 'text-error-700' : 'text-warning-700'}`}>
                          {attemptsLeft} de 3
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${attemptsLeft === 1 ? 'bg-error-500' : 'bg-warning-500'}`}
                          style={{ width: `${((3 - attemptsLeft) / 3) * 100}%` }}
                        />
                      </div>
                      {attemptsLeft === 1 && (
                        <p className="text-xs text-error-700 font-semibold">
                          🚨 Último intento — si falla, tu cuenta quedará bloqueada por 24 horas
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <Separator className="my-10 bg-primary/20 h-px" />

        {/* Botones de acción */}
        {!dashboardMode && (
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            {!isFirstTime && (
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={cancelEditing}>
                Cancelar
              </Button>
            )}
            {isFirstTime && (
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => router.back()}>
                Atrás
              </Button>
            )}
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={form.formState.isSubmitting || blocked}
            >
              {form.formState.isSubmitting ? 'Guardando...' : isFirstTime ? 'Continuar' : 'Guardar cambios'}
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
          icon={currentStep?.icon || CreditCard}
          title={currentStep?.title || "Cuenta bancaria para desembolso"}
          description={currentStep?.description || "Ingresa la cuenta donde recibirás el dinero del préstamo"}
        />
      </CardHeader>
      <CardContent className="pt-0">
        {content}
      </CardContent>
    </Card>
  );
}
