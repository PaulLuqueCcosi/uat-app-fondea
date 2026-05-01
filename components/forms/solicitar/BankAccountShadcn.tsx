'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, Wallet, CreditCard, Pencil, CheckCircle2, Eye, EyeOff } from 'lucide-react';
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
import { useAutoNavigate } from '@/hooks/use-auto-navigate';
import { ContinueButton } from '@/components/ui/continue-button';

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

function DataRow({ label, value }: { label: string; value?: string }) {
  const display = value === undefined || value === null || value === '' ? '—' : String(value);
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{display}</span>
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

  const [isVerified, setIsVerified] = useState(initialData?.overall_verified === true);
  const [isEditing, setIsEditing] = useState(!initialData?.overall_verified);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showCCI, setShowCCI] = useState(false);

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

  const handleEdit = () => {
    setIsVerified(false);
    setIsEditing(true);
    setSaveError(null);
  };

  const onSubmit = async (data: BankAccountFormValues) => {
    setSaveError(null);
    try {
      const bankAccountProfile = {
        bank: data.bank,
        account_type: data.account_type as any,
        cci: data.cci,
      };

      const result = await saveBankAccountProfile(bankAccountProfile);

      if (!result.success) {
        setSaveError(result.error || 'Error al guardar los datos.');
        return;
      }

      setIsVerified(true);
      setIsEditing(false);

      if (!dashboardMode) {
        autoNavigate.start();
      }
    } catch {
      setSaveError('Error de conexión. Por favor, inténtalo nuevamente.');
    }
  };

  // ── Vista readonly (datos guardados) ────────────────────────────────────────
  const bankLabel = BANKS.find(b => b.value === prevProfile?.bank)?.label ?? prevProfile?.bank ?? '—';
  const accountTypeLabel = ACCOUNT_TYPES.find(t => t.value === prevProfile?.account_type)?.label ?? '—';

  const maskedCCI = prevProfile?.cci ? '****' + prevProfile.cci.slice(-4) : '—';
  const displayCCI = showCCI ? prevProfile?.cci : maskedCCI;

  const verifiedView = (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-secondary">Cuenta bancaria guardada</p>
          <p className="text-xs text-muted-foreground">
            Tu cuenta para el desembolso está registrada. Puedes editarla si algo cambió.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleEdit} className="shrink-0 gap-1.5">
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
      </div>

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
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-800">{saveError}</p>
          </div>
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
