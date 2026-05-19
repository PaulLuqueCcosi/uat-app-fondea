'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CreditCard, Info, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { getCurrentStep } from '@/lib/funnel-steps';
import { isValidDNI } from '@/lib/validation';
import { KYCData } from '@/lib/types';
import { DNIAnnotatedCanvas } from '@/components/forms/solicitar/DNIAnnotatedCanvas';
import { DNIElectronicoAnnotatedCanvas } from '@/components/forms/solicitar/DNIElectronicoAnnotatedCanvas';
import type { DNIField } from '@/components/forms/solicitar/DNIAnnotatedCanvas';

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
import { Separator } from '@/components/ui/separator';
import { StickyBottomBar } from '@/components/ui/sticky-bottom-bar';
import { FormHeader } from '@/components/ui/form-header';
import { saveKYCData } from '@/app/actions/kyc.actions';
import type { KYCSaveResult } from '@/app/actions/kyc.actions';
import { performSignOut } from '@/app/actions/auth.actions';
import { useAutoNavigate } from '@/hooks/use-auto-navigate';
import { ContinueButton } from '@/components/ui/continue-button';
import { SaveErrorBanner } from '@/components/ui/save-error-banner';
import { DataRow } from '@/components/ui/data-row';
import { VerifiedBanner } from '@/components/ui/verified-banner';
import { AlertBanner } from '@/components/ui/alert-banner';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Clock, AlertTriangle } from 'lucide-react';

interface FunnelKYCValidationProps {
  dashboardMode?: boolean;
  initialData?: KYCData | null;
  initialBlocked?: boolean;
  initialBlockedHoursLeft?: number;
  initialAttemptsLeft?: number;
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

const kycValidationSchema = z.object({
  dni: z
    .string()
    .min(1, 'Ingresa tu número de DNI')
    .refine((val) => isValidDNI(val), {
      message: 'El DNI debe tener 8 dígitos',
    }),
  firstName: z
    .string()
    .min(1, 'Ingresa tu primer nombre')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras'),
  secondName: z
    .string()
    .min(1, 'Ingresa tu segundo nombre')
    .min(2, 'El segundo nombre debe tener al menos 2 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras'),
  firstLastName: z
    .string()
    .min(1, 'Ingresa tu primer apellido')
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras'),
  secondLastName: z
    .string()
    .min(1, 'Ingresa tu segundo apellido')
    .min(2, 'El segundo apellido debe tener al menos 2 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras'),
  verificationCode: z
    .string()
    .min(1, 'Ingresa el código de verificación')
    .length(1, 'El código debe tener exactamente 1 dígito')
    .regex(/^\d{1}$/, 'El código debe ser un número'),
  birth_date: z
    .string()
    .min(1, 'Ingresa tu fecha de nacimiento')
    .refine((val) => {
      // Acepta formato DD/MM/AAAA
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(val)) return false;
      const [day, month, year] = val.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      if (
        isNaN(date.getTime()) ||
        date.getDate() !== day ||
        date.getMonth() !== month - 1 ||
        date.getFullYear() !== year
      ) return false;
      return true;
    }, { message: 'Formato inválido. Usa DD/MM/AAAA' })
    .superRefine((val, ctx) => {
      const [day, month, year] = val.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear()
        - (today < new Date(today.getFullYear(), date.getMonth(), date.getDate()) ? 1 : 0);
      
      if (age < 18) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debes ser mayor de edad (mínimo 18 años)',
        });
      } else if (age > 120) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La edad máxima permitida es 120 años',
        });
      }
    }),
});

type KYCValidationFormValues = z.infer<typeof kycValidationSchema>;

export function FunnelKYCValidation({
  dashboardMode = false,
  initialData,
  initialBlocked = false,
  initialBlockedHoursLeft = 0,
  initialAttemptsLeft = 3,
}: FunnelKYCValidationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentStep = getCurrentStep(pathname);

  const [isVerified, setIsVerified] = useState(initialData?.status === 'VERIFIED');
  const [isEditing, setIsEditing] = useState(initialData?.status !== 'VERIFIED');
  const [wasVerified, setWasVerified] = useState(initialData?.status === 'VERIFIED');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveErrorCategory, setSaveErrorCategory] = useState<import('@/lib/types').ErrorCategory | undefined>(undefined);
  const [needsRelogin, setNeedsRelogin] = useState(false);

  // Datos guardados en este submit — tienen prioridad sobre initialData para el readonly
  const [savedData, setSavedData] = useState(initialData ?? null);

  const currentStatus = savedData?.status ?? initialData?.status;
  const isExpired = currentStatus === 'EXPIRED';

  const nextPath = currentStep?.nextPath || '/solicitar/kyc-documents';
  const autoNavigate = useAutoNavigate(() => router.push(nextPath));
  const [isVerifying, setIsVerifying] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(initialAttemptsLeft);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [blockedHoursLeft, setBlockedHoursLeft] = useState(initialBlockedHoursLeft);
  const [activeField, setActiveField] = useState<DNIField>(null);

  // Función para hacer focus en un campo específico
  const focusField = (fieldName: DNIField) => {
    if (!fieldName) return;
    
    // Buscar el input correspondiente y hacer focus
    const fieldElement = document.querySelector(`input[name="${fieldName}"]`) as HTMLInputElement;
    if (fieldElement) {
      fieldElement.focus();
      fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Forzar modo edición si está expirado
  useEffect(() => {
    if (isExpired && !isEditing) {
      setIsEditing(true);
    }
  }, [isExpired, isEditing]);

  // Cuenta regresiva del bloqueo (en horas)
  useEffect(() => {
    if (!blocked || blockedHoursLeft <= 0) return;
    const interval = setInterval(() => {
      setBlockedHoursLeft((prev) => {
        if (prev <= 1) {
          setBlocked(false);
          setAttemptsLeft(initialAttemptsLeft);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 3600000); // actualizar cada hora
    return () => clearInterval(interval);
  }, [blocked, blockedHoursLeft, initialAttemptsLeft]);

  const form = useForm<KYCValidationFormValues>({
    resolver: zodResolver(kycValidationSchema),
    defaultValues: {
      // REPLACED → formulario limpio; VERIFIED/EXPIRED → pre-llenar
      dni: initialData?.status === 'REPLACED' ? '' : (initialData?.dni ?? ''),
      firstName: initialData?.status === 'REPLACED' ? '' : (initialData?.firstName ?? ''),
      secondName: initialData?.status === 'REPLACED' ? '' : (initialData?.secondName ?? ''),
      firstLastName: initialData?.status === 'REPLACED' ? '' : (initialData?.firstLastName ?? ''),
      secondLastName: initialData?.status === 'REPLACED' ? '' : (initialData?.secondLastName ?? ''),
      verificationCode: initialData?.status === 'REPLACED' ? '' : (initialData?.verificationCode ?? ''),
      birth_date: initialData?.status === 'REPLACED' ? '' : (initialData?.birth_date ?? ''),
    },
  });

  // Efecto para resetear el formulario cuando se entra en modo edición
  useEffect(() => {
    if (isEditing && savedData) {
      form.reset({
        dni: savedData.dni ?? '',
        firstName: savedData.firstName ?? '',
        secondName: savedData.secondName ?? '',
        firstLastName: savedData.firstLastName ?? '',
        secondLastName: savedData.secondLastName ?? '',
        verificationCode: savedData.verificationCode ?? '',
        birth_date: savedData.birth_date ?? '',
      });
    }
  }, [isEditing, savedData, form]);

  const handleEdit = () => {
    setShowConfirmDialog(true);
  };

  const confirmEdit = () => {
    setShowConfirmDialog(false);
    setWasVerified(true);
    setIsVerified(false);
    setIsEditing(true);
    setSaveError(null);
    setSaveErrorCategory(undefined);
  };

  const onSubmit = async (data: KYCValidationFormValues) => {
    setIsVerifying(true);
    setSaveError(null);
    setSaveErrorCategory(undefined);

    try {
      const kycData: KYCData = {
        dni: data.dni,
        firstName: data.firstName,
        secondName: data.secondName,
        firstLastName: data.firstLastName,
        secondLastName: data.secondLastName,
        verificationCode: data.verificationCode,
        birth_date: data.birth_date,
      };

      const result: KYCSaveResult = await saveKYCData(kycData);

      if (!result.success) {
        // 409 — cuenta sin DNI, necesita re-login
        if (result.action === 're-login') {
          setNeedsRelogin(true);
          setSaveError(result.error);
          setIsVerifying(false);
          return;
        }

        if (result.errorCategory === 'rate_limit') {
          setBlocked(true);
          setBlockedHoursLeft(result.blockedHoursLeft ?? 0);
          setAttemptsLeft(0);
        } else if (result.attemptsLeft !== undefined) {
          setAttemptsLeft(result.attemptsLeft);
        }
        setSaveError(result.error || 'Error en la verificación');
        setSaveErrorCategory(result.errorCategory);
        setIsVerifying(false);
        return;
      }

      // Guardar los datos que acabamos de verificar para mostrarlos en readonly
      setSavedData({
        dni: data.dni,
        firstName: data.firstName,
        secondName: data.secondName,
        firstLastName: data.firstLastName,
        secondLastName: data.secondLastName,
        verificationCode: data.verificationCode,
        birth_date: data.birth_date,
        status: 'VERIFIED',
        verified: true,
      });

      setIsVerified(true);
      setIsEditing(false);
      setIsVerifying(false);

      if (!dashboardMode) {
        autoNavigate.start();
      }
    } catch (error) {
      console.error('Error en verificación KYC:', error);
      setSaveError('Error de conexión. Por favor, inténtalo nuevamente.');
      setSaveErrorCategory('network');
      setIsVerifying(false);
    }
  };

  // ── Vista verificada (readonly) ──────────────────────────────────────────
  const verifiedView = (
    <div className="space-y-6">
      {/* Banner de verificación exitosa */}
      <VerifiedBanner
        title="Identidad verificada"
        description="Tus datos fueron validados correctamente. Si necesitas corregir algo, puedes editar."
        onEdit={handleEdit}
      />

      {/* Resumen de datos en readonly */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DataRow label="DNI" value={savedData?.dni} mono />
        <DataRow label="Código de verificación" value={savedData?.verificationCode} mono />
        <DataRow
          label="Nombres"
          value={[
            savedData?.firstName,
            savedData?.secondName,
          ]
            .filter(Boolean)
            .join(' ')}
        />
        <DataRow
          label="Apellidos"
          value={[
            savedData?.firstLastName,
            savedData?.secondLastName,
          ]
            .filter(Boolean)
            .join(' ')}
        />
        <DataRow label="Fecha de nacimiento" value={savedData?.birth_date} />
      </div>

      {/* Botón continuar en modo funnel */}
      {!dashboardMode && (
        <>
          <Separator className="bg-primary/20 h-px" />
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Atrás
            </Button>
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
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4 text-amber-700" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-amber-900">
            Tu verificación ha expirado
          </p>
          <p className="text-sm text-amber-800 leading-relaxed">
            El tiempo de validez de tu verificación terminó. Revisa y corrige tus datos, luego vuelve a enviar para validar.
          </p>
        </div>
      </div>
    </div>
  );

  // ── Formulario editable ──────────────────────────────────────────────────
  const editForm = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        {/* Banner de expirado */}
        {expiredBanner}

        {/* Error de guardado */}
        {saveError && (
          <>
            <SaveErrorBanner
              error={saveError}
              errorCategory={saveErrorCategory}
            />
            <Separator className="my-10 bg-primary/20 h-px" />
          </>
        )}

        {/* DNI */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader title="Número de DNI" description="Ingresa tu número de documento" />
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="dni"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>Número de DNI *</FormLabel>
                  <Input
                    placeholder="12345678"
                    {...field}
                    className="w-full font-mono text-lg"
                    maxLength={8}
                    autoComplete="off"
                    inputMode='numeric'
                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                    onFocus={() => setActiveField('dni')}
                    onBlur={() => setActiveField(null)}
                  />
                  <FormDescription>8 dígitos sin espacios ni guiones</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="my-10 bg-primary/20 h-px" />

        {/* Nombres */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader title="Nombres" description="Como aparecen en tu DNI" />
          <div className="space-y-8 md:col-span-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>Primer nombre *</FormLabel>
                  <Input
                    placeholder="CARLOS"
                    {...field}
                    className="w-full"
                    onChange={(e) =>
                      field.onChange(
                        e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').toUpperCase()
                      )
                    }
                    onFocus={() => setActiveField('firstName')}
                    onBlur={() => setActiveField(null)}
                  />
                  <FormDescription>Exactamente como aparece en tu DNI</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secondName"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>Segundo nombre *</FormLabel>
                  <Input
                    placeholder="ANDRES"
                    {...field}
                    className="w-full"
                    onChange={(e) =>
                      field.onChange(
                        e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').toUpperCase()
                      )
                    }
                    onFocus={() => setActiveField('secondName')}
                    onBlur={() => setActiveField(null)}
                  />
                  <FormDescription>Exactamente como aparece en tu DNI</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="my-10 bg-primary/20 h-px" />

        {/* Apellidos */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader title="Apellidos" description="Como aparecen en tu DNI" />
          <div className="space-y-8 md:col-span-2">
            <FormField
              control={form.control}
              name="firstLastName"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>Primer apellido *</FormLabel>
                  <Input
                    placeholder="GARCIA"
                    {...field}
                    className="w-full"
                    onChange={(e) =>
                      field.onChange(
                        e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').toUpperCase()
                      )
                    }
                    onFocus={() => setActiveField('firstLastName')}
                    onBlur={() => setActiveField(null)}
                  />
                  <FormDescription>Apellido paterno</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secondLastName"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>Segundo apellido *</FormLabel>
                  <Input
                    placeholder="RAMIREZ"
                    {...field}
                    className="w-full"
                    onChange={(e) =>
                      field.onChange(
                        e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').toUpperCase()
                      )
                    }
                    onFocus={() => setActiveField('secondLastName')}
                    onBlur={() => setActiveField(null)}
                  />
                  <FormDescription>Apellido materno</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="my-10 bg-primary/20 h-px" />

        {/* Código de verificación */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader title="Código de verificación" description="Código verificador de tu DNI" />
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="verificationCode"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>Código de verificación *</FormLabel>
                  <Input
                    placeholder="1"
                    {...field}
                    className="w-full font-mono text-lg"
                    maxLength={1}
                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                    onFocus={() => setActiveField('verificationCode')}
                    onBlur={() => setActiveField(null)}
                  />
                  <FormDescription>
                    El dígito de verificación que aparece en la parte inferior de tu DNI
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Fecha de nacimiento */}
        <Separator className="my-10 bg-primary/20 h-px" />
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader title="Fecha de nacimiento" description="Como aparece en tu DNI" />
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="birth_date"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>Fecha de nacimiento *</FormLabel>
                  <Input
                    type="text"
                    placeholder="15/05/1990"
                    {...field}
                    className="w-full"
                    maxLength={10}
                    onChange={(e) => {
                      // Máscara automática DD/MM/AAAA
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
                      if (val.length > 5) val = val.slice(0, 5) + '/' + val.slice(5);
                      if (val.length > 10) val = val.slice(0, 10);
                      field.onChange(val);
                    }}
                    onFocus={() => setActiveField('birth_date')}
                    onBlur={() => setActiveField(null)}
                  />
                  <FormDescription>Debes de ser mayor de edad.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Panel de intentos y bloqueo */}
        {(blocked || (saveError && attemptsLeft !== undefined && attemptsLeft < initialAttemptsLeft)) && (
          <>
            <Separator className="my-10 bg-primary/20 h-px" />
            {blocked ? (
              <AlertBanner
                variant="error"
                title={`Bloqueado por ${blockedHoursLeft} hora${blockedHoursLeft !== 1 ? 's' : ''}`}
                description="Has superado el número máximo de intentos. Podrás intentarlo nuevamente cuando expire el bloqueo."
                blockedHoursLeft={blockedHoursLeft}
              />
            ) : (
              <AlertBanner
                variant={attemptsLeft === 1 ? 'error' : 'warning'}
                title={attemptsLeft === 1 ? 'Último intento' : 'Datos no válidos'}
                description={saveError ?? ''}
                attemptsLeft={attemptsLeft}
                maxAttempts={initialAttemptsLeft}
              />
            )}
            {!blocked && (
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border mt-4">
                <p className="font-medium text-foreground">Revisa lo siguiente:</p>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>Los datos deben coincidir <strong>exactamente</strong> con tu DNI físico</li>
                  <li>Nombres y apellidos en mayúsculas, sin tildes</li>
                  <li>El código de verificación es el dígito al final de tu DNI</li>
                  <li>La fecha de nacimiento en formato DD/MM/AAAA</li>
                </ul>
              </div>
            )}
          </>
        )}

        <Separator className="my-10 bg-primary/20 h-px" />

        {/* Botones */}
        {!dashboardMode && (
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            {wasVerified ? (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => { setIsVerified(true); setIsEditing(false); setWasVerified(true); setSaveError(null); }}
                disabled={isVerifying}
              >
                Cancelar
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => router.back()}
                disabled={isVerifying}
              >
                Atrás
              </Button>
            )}
            <Button type="submit" className="w-full sm:w-auto" disabled={isVerifying || blocked}>
              {isVerifying ? <ButtonSpinner label="Verificando..." /> : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Verificar datos
                </span>
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );

  // ── Vista re-login (409 — cuenta sin DNI) ─────────────────────────────────
  if (needsRelogin) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="w-14 h-14 rounded-full bg-warning-50 flex items-center justify-center">
              <Info className="w-7 h-7 text-warning-700" />
            </div>
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-neutral-900">
                Cuenta incompleta
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed max-w-sm">
                {saveError || 'No se encontró un documento registrado en tu cuenta. Por favor, cierra sesión e inicia sesión nuevamente.'}
              </p>
            </div>
            <Button onClick={() => performSignOut()} className="w-full max-w-xs">
              Cerrar sesión e iniciar de nuevo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Contenido activo según estado ────────────────────────────────────────
  const content = isVerified && !isEditing && !isExpired
    ? verifiedView
    : editForm;

  if (dashboardMode) {
    return (
      <>
        <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 xl:items-start xl:justify-center max-w-7xl mx-auto">
          <div className="flex-1 xl:max-w-2xl">
            <Card className="w-full">
              <CardContent className="pt-6">
                {content}
              </CardContent>
            </Card>
            {(!isVerified || isEditing) && (
              <StickyBottomBar
                ctaLabel={isVerifying ? 'Verificando...' : 'Verificar datos'}
                onCta={form.handleSubmit(onSubmit)}
                loading={isVerifying}
                ctaDisabled={blocked}
              />
            )}
          </div>
          <div className="xl:shrink-0">
            {/* Solo mostrar ayuda del DNI cuando está editando */}
            {(!isVerified || isEditing) && <DNIHelpCard activeField={activeField} onFieldClick={focusField} />}
          </div>
        </div>

        {/* Modal de confirmación al editar */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Editar verificación?</DialogTitle>
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
      <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 xl:items-start xl:justify-center max-w-7xl mx-auto">
        <div className="flex-1 xl:max-w-2xl">
          <Card className="w-full">
            <CardHeader className="pb-4">
              <FormHeader
                icon={currentStep?.icon || CreditCard}
                title="Verificación de identidad"
                description={
                  isVerified && !isEditing
                    ? 'Tu identidad ha sido verificada correctamente'
                    : currentStatus === 'EXPIRED' && !isEditing
                    ? 'Tu verificación ha expirado, debes validar nuevamente'
                    : 'Ingresa tus datos exactamente como aparecen en tu DNI'
                }
              />
            </CardHeader>
            <CardContent className="pt-0">{content}</CardContent>
          </Card>
        </div>
        <div className="xl:shrink-0">
          {/* Solo mostrar ayuda del DNI cuando está editando */}
          {(!isVerified || isEditing) && <DNIHelpCard activeField={activeField} onFieldClick={focusField} />}
        </div>
      </div>

      {/* Modal de confirmación al editar */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Editar verificación?</DialogTitle>
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

// ── Componente auxiliar: spinner para botones ────────────────────────────────
// IMPORTANTE: nunca usar <div> ni <span self-closing /> mezclado con texto
// dentro de <button>. Siempre encapsular en un componente que retorne un
// único elemento raíz con todo el contenido adentro.
function ButtonSpinner({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        role="status"
        aria-label="Cargando"
        className="block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"
      ></span>
      <span>{label}</span>
    </span>
  );
}


// ── Componente auxiliar: card de ayuda DNI ───────────────────────────────────
function DNIHelpCard({ activeField, onFieldClick }: { activeField: DNIField; onFieldClick?: (field: DNIField) => void }) {
  const [showFullDisclaimer, setShowFullDisclaimer] = useState(false);

  return (
    <div className="xl:sticky xl:top-4">
      <Card className="w-full max-w-lg mx-auto xl:w-[600px]">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-primary">¿Dónde encuentro estos datos?</h3>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-4">
            {/* DNI Azul */}
            <div className="w-full rounded-xl overflow-hidden border border-border shadow-sm">
              <DNIAnnotatedCanvas activeField={activeField} onFieldClick={onFieldClick} />
            </div>
            
            {/* DNI Electrónico */}
            <div className="w-full rounded-xl overflow-hidden border border-border shadow-sm">
              <DNIElectronicoAnnotatedCanvas activeField={activeField} debugMode={false} onFieldClick={onFieldClick} />
            </div>
            
            {/* Disclaimer Legal Desplegable */}
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg border border-border/50">
              <button
                type="button"
                onClick={() => setShowFullDisclaimer(!showFullDisclaimer)}
                className="w-full p-3 text-left flex items-center justify-between hover:bg-muted/50 transition-colors rounded-lg"
              >
                <span className="font-medium">
                  Imágenes demostrativas sin valor legal
                </span>
                {showFullDisclaimer ? (
                  <ChevronUp className="h-3 w-3 shrink-0" />
                ) : (
                  <ChevronDown className="h-3 w-3 shrink-0" />
                )}
              </button>
              
              {showFullDisclaimer && (
                <div className="px-3 pb-3 pt-0">
                  <p className="leading-relaxed text-xs">
                    Las imágenes mostradas son únicamente con fines demostrativos y educativos. 
                    Los datos personales son ficticios y cualquier similitud con personas reales es pura coincidencia. 
                    Estas imágenes no tienen valor legal ni representan documentos oficiales válidos.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
