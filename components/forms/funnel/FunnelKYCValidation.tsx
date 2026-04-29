'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CreditCard, Info, CheckCircle2, Pencil, ShieldCheck } from 'lucide-react';
import { getCurrentStep } from '@/lib/funnel-steps';
import { isValidDNI } from '@/lib/validation';
import { KYCData } from '@/lib/types';

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
import { useState, useEffect } from 'react';

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
    .optional()
    .refine((val) => !val || val.length >= 2, {
      message: 'El segundo nombre debe tener al menos 2 caracteres',
    })
    .refine((val) => !val || /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(val), {
      message: 'Solo se permiten letras',
    }),
  firstLastName: z
    .string()
    .min(1, 'Ingresa tu primer apellido')
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras'),
  secondLastName: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 2, {
      message: 'El segundo apellido debe tener al menos 2 caracteres',
    })
    .refine((val) => !val || /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(val), {
      message: 'Solo se permiten letras',
    }),
  verificationCode: z
    .string()
    .min(1, 'Ingresa el código de verificación')
    .length(1, 'El código debe tener exactamente 1 dígito')
    .regex(/^\d{1}$/, 'El código debe ser un número'),
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

  const [isVerified, setIsVerified] = useState(initialData?.verified === true);
  const [isEditing, setIsEditing] = useState(!initialData?.verified);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState(initialAttemptsLeft);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [blockedHoursLeft, setBlockedHoursLeft] = useState(initialBlockedHoursLeft);

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
      dni: initialData?.dni ?? '',
      firstName: initialData?.firstName ?? '',
      secondName: initialData?.secondName ?? '',
      firstLastName: initialData?.firstLastName ?? '',
      secondLastName: initialData?.secondLastName ?? '',
      verificationCode: initialData?.verificationCode ?? '',
    },
  });

  const handleEdit = () => {
    // Al editar, el estado verificado se pierde — el backend re-validará al guardar
    setIsVerified(false);
    setIsEditing(true);
    setVerificationError(null);
  };

  const onSubmit = async (data: KYCValidationFormValues) => {
    setIsVerifying(true);
    setVerificationError(null);

    try {
      const kycData: KYCData = {
        dni: data.dni,
        firstName: data.firstName,
        secondName: data.secondName || undefined,
        firstLastName: data.firstLastName,
        secondLastName: data.secondLastName || undefined,
        verificationCode: data.verificationCode,
      };

      const result: KYCSaveResult = await saveKYCData(kycData);

      if (!result.success) {
        if (result.blocked) {
          setBlocked(true);
          setBlockedHoursLeft(result.blockedHoursLeft ?? 0);
          setAttemptsLeft(0);
        } else if (result.attemptsLeft !== undefined) {
          setAttemptsLeft(result.attemptsLeft);
        }
        setVerificationError(result.error || 'Error en la verificación');
        setIsVerifying(false);
        setTimeout(() => {
          document
            .querySelector('[data-error="verification"]')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        return;
      }

      setIsVerified(true);
      setIsEditing(false);
      setIsVerifying(false);

      if (!dashboardMode) {
        router.push(currentStep?.nextPath || '/funnel/kyc-documents');
      }
    } catch (error) {
      console.error('Error en verificación KYC:', error);
      setVerificationError('Error de conexión. Por favor, inténtalo nuevamente.');
      setIsVerifying(false);
    }
  };

  // ── Vista verificada (readonly) ──────────────────────────────────────────
  const verifiedView = (
    <div className="space-y-6">
      {/* Banner de verificación exitosa */}
      <div className="flex items-center gap-3 rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-secondary" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-secondary">Identidad verificada</p>
          <p className="text-xs text-muted-foreground">
            Tus datos fueron validados correctamente. Si necesitas corregir algo, puedes editar.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleEdit}
          className="shrink-0 gap-1.5"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
      </div>

      {/* Resumen de datos en readonly */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DataRow label="DNI" value={initialData?.dni ?? form.getValues('dni')} mono />
        <DataRow label="Código de verificación" value={initialData?.verificationCode ?? form.getValues('verificationCode')} mono />
        <DataRow
          label="Nombres"
          value={[
            initialData?.firstName ?? form.getValues('firstName'),
            initialData?.secondName ?? form.getValues('secondName'),
          ]
            .filter(Boolean)
            .join(' ')}
        />
        <DataRow
          label="Apellidos"
          value={[
            initialData?.firstLastName ?? form.getValues('firstLastName'),
            initialData?.secondLastName ?? form.getValues('secondLastName'),
          ]
            .filter(Boolean)
            .join(' ')}
        />
      </div>

      {/* Botón continuar en modo funnel */}
      {!dashboardMode && (
        <>
          <Separator className="bg-primary/20 h-px" />
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Atrás
            </Button>
            <Button
              type="button"
              onClick={() => router.push(currentStep?.nextPath || '/funnel/kyc-documents')}
            >
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

  // ── Formulario editable ──────────────────────────────────────────────────
  const editForm = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        {/* DNI */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader title="Número de DNI" description="Ingresa tu número de documento" />
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="dni"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>Número de DNI</FormLabel>
                  <Input
                    placeholder="12345678"
                    {...field}
                    className="w-full font-mono text-lg"
                    maxLength={8}
                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
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
                    placeholder="Juan"
                    {...field}
                    className="w-full"
                    onChange={(e) =>
                      field.onChange(
                        e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').toUpperCase()
                      )
                    }
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
                  <FormLabel>Segundo nombre</FormLabel>
                  <Input
                    placeholder="Carlos (opcional)"
                    {...field}
                    className="w-full"
                    onChange={(e) =>
                      field.onChange(
                        e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').toUpperCase()
                      )
                    }
                  />
                  <FormDescription>Solo si tienes segundo nombre en tu DNI</FormDescription>
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
                    placeholder="Pérez"
                    {...field}
                    className="w-full"
                    onChange={(e) =>
                      field.onChange(
                        e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').toUpperCase()
                      )
                    }
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
                  <FormLabel>Segundo apellido</FormLabel>
                  <Input
                    placeholder="García (opcional)"
                    {...field}
                    className="w-full"
                    onChange={(e) =>
                      field.onChange(
                        e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').toUpperCase()
                      )
                    }
                  />
                  <FormDescription>Apellido materno, si lo tienes</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="my-10 bg-primary/20 h-px" />

        {/* Código de verificación */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader title="Código de verificación" description="Los 3 dígitos de tu DNI" />
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="verificationCode"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>Código de verificación</FormLabel>
                  <Input
                    placeholder="5"
                    {...field}
                    className="w-full font-mono text-lg"
                    maxLength={1}
                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
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

        {/* Error de verificación / bloqueo */}
        {(verificationError || blocked) && (
          <>
            <Separator className="my-10 bg-primary/20 h-px" />
            <div
              data-error="verification"
              className={`rounded-lg border p-4 ${blocked ? 'border-destructive/30 bg-destructive/5' : 'border-warning/30 bg-warning/5'}`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 shrink-0 text-lg ${blocked ? 'text-destructive' : 'text-warning'}`}>
                  {blocked ? '🔒' : '⚠️'}
                </span>
                <div className="space-y-2 w-full">
                  <p className={`text-sm font-semibold ${blocked ? 'text-destructive' : 'text-warning'}`}>
                    {blocked
                      ? `Verificación bloqueada por ${blockedHoursLeft} hora${blockedHoursLeft !== 1 ? 's' : ''}`
                      : 'Los datos no coinciden'}
                  </p>
                  <p className="text-sm text-muted-foreground">{verificationError}</p>

                  {/* Barra de intentos — solo si no está bloqueado */}
                  {!blocked && attemptsLeft > 0 && (
                    <div className="pt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Intentos restantes</span>
                        <span className={`font-semibold ${attemptsLeft === 1 ? 'text-destructive' : 'text-foreground'}`}>
                          {attemptsLeft} de {initialAttemptsLeft}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${attemptsLeft === 1 ? 'bg-destructive' : 'bg-warning'}`}
                          style={{ width: `${((initialAttemptsLeft - attemptsLeft) / initialAttemptsLeft) * 100}%` }}
                        />
                      </div>
                      {attemptsLeft === 1 && (
                        <p className="text-xs text-destructive font-medium">
                          ⚠ Último intento — si falla, quedará bloqueado 24 horas
                        </p>
                      )}
                    </div>
                  )}

                  {/* Consejos — solo si no está bloqueado */}
                  {!blocked && (
                    <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-border mt-2">
                      <p className="font-medium pt-2">Revisa lo siguiente:</p>
                      <ul className="list-disc list-inside space-y-1 ml-1">
                        <li>Los datos deben coincidir exactamente con tu DNI físico</li>
                        <li>Nombres y apellidos en mayúsculas, sin tildes</li>
                        <li>El código son los 3 dígitos en la parte inferior del DNI</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <Separator className="my-10 bg-primary/20 h-px" />

        {/* Botones */}
        {!dashboardMode && (
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => router.back()}
              disabled={isVerifying}
            >
              Atrás
            </Button>
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

  // ── Contenido activo según estado ────────────────────────────────────────
  const content = isVerified && !isEditing ? verifiedView : editForm;

  if (dashboardMode) {
    return (
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
          <DNIHelpCard />
        </div>
      </div>
    );
  }

  return (
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
                  : 'Ingresa tus datos exactamente como aparecen en tu DNI'
              }
            />
          </CardHeader>
          <CardContent className="pt-0">{content}</CardContent>
        </Card>
      </div>
      <div className="xl:shrink-0">
        <DNIHelpCard />
      </div>
    </div>
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

// ── Componente auxiliar: fila de dato en readonly ────────────────────────────
function DataRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium text-foreground ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}

// ── Componente auxiliar: card de ayuda DNI ───────────────────────────────────
function DNIHelpCard() {
  return (
    <div className="xl:sticky xl:top-4">
      <Card className="w-full max-w-sm mx-auto xl:w-80">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-primary">Tu DNI</h3>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-lg shadow-lg text-white aspect-[1.58/1] flex flex-col justify-between p-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-bold">
                PERÚ
              </div>
            </div>
            <div className="relative z-10 space-y-2">
              <div>
                <span className="text-[9px] opacity-70 block mb-0.5">
                  DOCUMENTO NACIONAL DE IDENTIDAD
                </span>
                <span className="font-mono bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-sm font-bold inline-block shadow-sm">
                  12345678
                </span>
              </div>
              <div className="space-y-1.5">
                <div>
                  <span className="text-[9px] opacity-70 block mb-0.5">NOMBRES</span>
                  <span className="bg-green-400 text-green-900 px-2 py-0.5 rounded font-medium text-xs inline-block shadow-sm">
                    JUAN CARLOS
                  </span>
                </div>
                <div>
                  <span className="text-[9px] opacity-70 block mb-0.5">APELLIDOS</span>
                  <span className="bg-green-400 text-green-900 px-2 py-0.5 rounded font-medium text-xs inline-block shadow-sm">
                    PÉREZ GARCÍA
                  </span>
                </div>
              </div>
            </div>
            <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/30">
              <span className="text-[9px] opacity-70">CÓDIGO DE VERIFICACIÓN</span>
              <span className="bg-orange-400 text-orange-900 px-2 py-1 rounded font-mono font-bold text-xs shadow-sm">
                5
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
