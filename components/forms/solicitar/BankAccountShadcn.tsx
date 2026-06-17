'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CreditCard, Building2, Eye, EyeOff } from 'lucide-react';
import { getCurrentStep } from '@/lib/funnel-steps';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { FormHeader } from '@/components/ui/form-header';
import {
  saveBankAccountProfile,
  getBankAccountProfileStatus,
  revealAccountNumber,
  revealCCI,
  type RevealResult,
} from '@/app/actions/bank-account.actions';
import type { BankAccountProfileStatus } from '@/lib/types';
import { useAutoNavigate } from '@/hooks/use-auto-navigate';
import { ContinueButton } from '@/components/ui/continue-button';
import { DataRow } from '@/components/ui/data-row';
import { VerifiedBanner } from '@/components/ui/verified-banner';
import { SaveErrorBanner } from '@/components/ui/save-error-banner';
import { AlertBanner } from '@/components/ui/alert-banner';

interface FunnelBankAccountProps {
  dashboardMode?: boolean;
  initialData?: BankAccountProfileStatus;
  onClose?: () => void;
}

function SectionHeader({ title, description }: { title: string; description: string }) {
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
  bank_name: z.string().min(1, 'Selecciona tu banco'),
  account_type: z.string().min(1, 'Selecciona el tipo de cuenta'),
  cci: z
    .string()
    .length(20, 'El CCI debe tener exactamente 20 dígitos')
    .regex(/^\d+$/, 'Solo se permiten números'),
  account_number: z
    .string()
    .min(10, 'El número de cuenta debe tener al menos 10 dígitos')
    .max(20, 'El número de cuenta debe tener máximo 20 dígitos')
    .regex(/^\d+$/, 'Solo se permiten números'),
});

type BankAccountFormValues = z.infer<typeof bankAccountFormSchema>;

export function FunnelBankAccountShadcn({ dashboardMode = false, initialData, onClose }: FunnelBankAccountProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentStep = getCurrentStep(pathname);

  const [isVerified, setIsVerified] = useState(initialData?.overall_verified ?? false);
  const [isEditing, setIsEditing] = useState(!initialData?.overall_verified);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveErrorCategory, setSaveErrorCategory] = useState<import('@/lib/types').ErrorCategory | undefined>(undefined);
  const [blocked, setBlocked] = useState(false);
  const [blockedHoursLeft, setBlockedHoursLeft] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState<number | undefined>(undefined);
  const [maxAttempts, setMaxAttempts] = useState<number | undefined>(undefined);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [wasVerified, setWasVerified] = useState(initialData?.overall_verified ?? false);

  // Datos guardados en este submit
  const [savedProfile, setSavedProfile] = useState(initialData?.profile ?? null);

  // Status local — se actualiza después de submit exitoso para evitar que
  // el useEffect de expiración vuelva a forzar edición
  const [localStatus, setLocalStatus] = useState(initialData?.status);
  const isExpired = localStatus === 'EXPIRED';

  // Revealed sensitive data
  const [revealedAccountNumber, setRevealedAccountNumber] = useState<string | null>(null);
  const [revealedCCI, setRevealedCCI] = useState<string | null>(null);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showCCI, setShowCCI] = useState(false);

  const nextPath = currentStep?.nextPath || '/solicitar/summary';
  const autoNavigate = useAutoNavigate(() => router.push(nextPath));

  // Forzar modo edición si está expirado (solo si no está verificado)
  useEffect(() => {
    if (isExpired && !isEditing && !isVerified) {
      setIsEditing(true);
      setIsVerified(false);
    }
  }, [isExpired, isEditing, isVerified]);

  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountFormSchema),
    defaultValues: {
      bank_name: initialData?.profile?.bank_name || '',
      account_type: initialData?.profile?.account_type || '',
      cci: initialData?.profile?.cci || '',
      account_number: initialData?.profile?.account_number || '',
    },
  });

  // Efecto para resetear el formulario cuando se entra en modo edición
  useEffect(() => {
    if (isEditing && initialData?.profile) {
      const profile = initialData.profile;
      form.reset({
        bank_name: profile.bank_name || '',
        account_type: profile.account_type || '',
        cci: profile.cci || '',
        account_number: profile.account_number || '',
      });
    }
  }, [isEditing, initialData, form]);

  // ── Edit handlers ───────────────────────────────────────────────────────────

  const handleEdit = () => {
    if (isVerified) {
      setShowConfirmDialog(true);
      return;
    }
    setIsEditing(true);
    setSaveError(null);
    setSaveErrorCategory(undefined);
  };

  const confirmEdit = () => {
    setShowConfirmDialog(false);
    setWasVerified(true);
    setIsVerified(false);
    setIsEditing(true);
    setSaveError(null);
    setSaveErrorCategory(undefined);
    // Clear revealed data on edit
    setRevealedAccountNumber(null);
    setRevealedCCI(null);
    setShowAccountNumber(false);
    setShowCCI(false);
  };

  // ── Reveal handlers ─────────────────────────────────────────────────────────

  const handleRevealAccountNumber = async () => {
    if (revealedAccountNumber) {
      setShowAccountNumber(!showAccountNumber);
      return;
    }
    const result = await revealAccountNumber();
    if (result.success) {
      setRevealedAccountNumber(result.value);
      setShowAccountNumber(true);
    }
  };

  const handleRevealCCI = async () => {
    if (revealedCCI) {
      setShowCCI(!showCCI);
      return;
    }
    const result = await revealCCI();
    if (result.success) {
      setRevealedCCI(result.value);
      setShowCCI(true);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const onSubmit = async (data: BankAccountFormValues) => {
    setSaveError(null);
    setSaveErrorCategory(undefined);
    setBlocked(false);
    setBlockedHoursLeft(0);
    setAttemptsLeft(undefined);
    setMaxAttempts(undefined);

    const result = await saveBankAccountProfile({
      bank_name: data.bank_name,
      account_type: data.account_type as 'AHORROS' | 'CORRIENTE',
      cci: data.cci,
      account_number: data.account_number,
    });

    if (!result.success) {
      if (result.errorCategory === 'rate_limit') {
        setBlocked(true);
        setBlockedHoursLeft(result.blockedHoursLeft ?? 24);
      }
      if (result.httpStatus === 422) {
        setAttemptsLeft(result.attemptsLeft);
        setMaxAttempts(result.maxAttempts);
      }
      setSaveError(result.error ?? 'Error al guardar.');
      setSaveErrorCategory(result.errorCategory);
      return;
    }

    // Guardar datos para la vista readonly
    setSavedProfile({
      bank_name: data.bank_name,
      account_type: data.account_type as 'AHORROS' | 'CORRIENTE',
      cci: data.cci,
      account_number: data.account_number,
      verified: true,
    });
    setIsVerified(true);
    setIsEditing(false);
    setLocalStatus('VERIFIED');

    // Clear revealed data
    setRevealedAccountNumber(null);
    setRevealedCCI(null);
    setShowAccountNumber(false);
    setShowCCI(false);

    if (!dashboardMode) {
      autoNavigate.start();
    }
  };

  // ── Vista resumen ───────────────────────────────────────────────────────────

  const bankLabel = BANKS.find(b => b.value === savedProfile?.bank_name)?.label ?? savedProfile?.bank_name ?? '—';
  const accountTypeLabel = ACCOUNT_TYPES.find(t => t.value === savedProfile?.account_type)?.label ?? '—';

  const maskedAccountNumber = savedProfile?.account_number
    ? '****' + savedProfile.account_number.slice(-4)
    : '—';
  const displayAccountNumber = showAccountNumber && revealedAccountNumber
    ? revealedAccountNumber
    : maskedAccountNumber;

  const maskedCCI = savedProfile?.cci
    ? '****' + savedProfile.cci.slice(-4)
    : '—';
  const displayCCI = showCCI && revealedCCI
    ? revealedCCI
    : maskedCCI;

  const summaryView = (
    <div className="space-y-6">
      <VerifiedBanner
        title="Cuenta bancaria guardada"
        description="Tu cuenta para el desembolso está registrada. Puedes editarla si algo cambió."
        onEdit={handleEdit}
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
              <span className="text-xs text-muted-foreground">Número de cuenta</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground font-mono">{displayAccountNumber}</span>
                <button
                  type="button"
                  onClick={handleRevealAccountNumber}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                  aria-label={showAccountNumber ? 'Ocultar número de cuenta' : 'Mostrar número de cuenta'}
                >
                  {showAccountNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">CCI</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground font-mono">{displayCCI}</span>
                <button
                  type="button"
                  onClick={handleRevealCCI}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                  aria-label={showCCI ? 'Ocultar CCI' : 'Mostrar CCI'}
                >
                  {showCCI ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

  // ── Formulario ──────────────────────────────────────────────────────────────

  const formView = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">

        {/* Banner de expirado */}
        {isExpired && (
          <>
            <AlertBanner
              variant="warning"
              title="Tu verificación ha expirado"
              description="El tiempo de validez de tu verificación terminó. Revisa y corrige tus datos, luego vuelve a enviar para validar."
            />
            <Separator className="my-10 bg-primary/20 h-px" />
          </>
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
              name="bank_name"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>Banco *</FormLabel>
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
                  <FormLabel>Tipo de cuenta *</FormLabel>
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
              name="account_number"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>Número de cuenta *</FormLabel>
                  <Input
                    placeholder="12345678901234"
                    {...field}
                    className="w-full"
                    maxLength={20}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 20);
                      field.onChange(cleaned);
                    }}
                  />
                  <FormDescription>Entre 10 y 20 dígitos</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cci"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>Código de Cuenta Interbancario (CCI) *</FormLabel>
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

        {/* Error de guardado */}
        {saveError && (
          <SaveErrorBanner
            error={saveError}
            errorCategory={saveErrorCategory}
          />
        )}

        {/* Bloqueo por max intentos */}
        {blocked && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 mb-4">
            <div className="flex items-center gap-2 font-semibold">
              <span>🔒</span>
              Módulo bloqueado por {blockedHoursLeft} hora{blockedHoursLeft !== 1 ? 's' : ''}
            </div>
            <p className="mt-1 text-red-700">
              Has superado el máximo de intentos permitidos. Podrás volver a intentarlo cuando termine el tiempo de bloqueo.
            </p>
          </div>
        )}

        {/* Intentos restantes */}
        {attemptsLeft !== undefined && attemptsLeft > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 mb-4">
            Te queda{attemptsLeft !== 1 ? 'n' : ''} {attemptsLeft} intento{attemptsLeft !== 1 ? 's' : ''} de {maxAttempts}.
          </div>
        )}

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          {isVerified ? (
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={dashboardMode && onClose ? onClose : () => { setIsEditing(false); setSaveError(null); setSaveErrorCategory(undefined); }}>
              Cancelar
            </Button>
          ) : (
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={dashboardMode && onClose ? onClose : () => router.back()}>
              {dashboardMode ? 'Cancelar' : 'Atrás'}
            </Button>
          )}
          <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting || blocked}>
            {form.formState.isSubmitting ? 'Guardando...' : isVerified ? 'Guardar cambios' : 'Continuar'}
          </Button>
        </div>
      </form>
    </Form>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {dashboardMode ? (
        <>
          <div className="max-w-3xl mx-auto">
            <Card className="w-full">
              <CardHeader className="pb-4">
                <FormHeader
                  icon={CreditCard}
                  title="Cuenta bancaria para desembolso"
                  description={
                    isVerified && !isEditing
                      ? 'Tu cuenta está registrada'
                      : 'Ingresa la cuenta donde recibirás el dinero del préstamo'
                  }
                />
              </CardHeader>
              <CardContent className="pt-0">
                {isVerified && !isEditing ? summaryView : formView}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader className="pb-4">
            <FormHeader
              icon={currentStep?.icon || CreditCard}
              title={currentStep?.title || "Cuenta bancaria para desembolso"}
              description={
                isVerified && !isEditing
                  ? 'Tu cuenta está registrada'
                  : isExpired && !isEditing
                  ? 'Tu verificación ha expirado, debes validar nuevamente'
                  : currentStep?.description || "Ingresa la cuenta donde recibirás el dinero del préstamo"
              }
            />
          </CardHeader>
          <CardContent className="pt-0">
            {isVerified && !isEditing ? summaryView : formView}
          </CardContent>
        </Card>
      )}

      {/* Modal de confirmación al editar */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⚠️ ¿Editar cuenta bancaria?</DialogTitle>
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
