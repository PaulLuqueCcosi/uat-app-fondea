'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CreditCard, Info, CheckCircle2 } from 'lucide-react';
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
import { verifyDNI } from '@/app/actions/loan.actions';
import { useState } from 'react';

interface FunnelKYCValidationProps {
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
    .length(3, 'El código debe tener exactamente 3 dígitos')
    .regex(/^\d{3}$/, 'El código debe contener solo números'),
});

type KYCValidationFormValues = z.infer<typeof kycValidationSchema>;

export function FunnelKYCValidation({ dashboardMode = false }: FunnelKYCValidationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentStep = getCurrentStep(pathname);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const form = useForm<KYCValidationFormValues>({
    resolver: zodResolver(kycValidationSchema),
    defaultValues: {
      dni: '',
      firstName: '',
      secondName: '',
      firstLastName: '',
      secondLastName: '',
      verificationCode: '',
    },
  });

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

      const result = await verifyDNI(kycData);

      if (!result.success) {
        setVerificationError(result.error || 'Error en la verificación');
        setIsVerifying(false);
        
        // Scroll al error para mejor UX
        setTimeout(() => {
          const errorElement = document.querySelector('[data-error="verification"]');
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        
        return;
      }

      // Verificación exitosa
      if (dashboardMode) {
        router.push('/dashboard');
      } else {
        router.push(currentStep?.nextPath || '/funnel/kyc-documents');
      }
    } catch (error) {
      console.error('Error en verificación KYC:', error);
      setVerificationError('Error de conexión. Por favor, inténtalo nuevamente.');
      setIsVerifying(false);
    }
  };

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        {/* Sección de datos del DNI */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader
            title="Número de DNI"
            description="Ingresa tu número de documento"
          />

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
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      field.onChange(value);
                    }}
                  />
                  <FormDescription>8 dígitos sin espacios ni guiones</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="my-10 bg-primary/20 h-px" />

        {/* Sección de nombres */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader
            title="Nombres"
            description="Como aparecen en tu DNI"
          />

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
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                      field.onChange(value.toUpperCase());
                    }}
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
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                      field.onChange(value.toUpperCase());
                    }}
                  />
                  <FormDescription>Solo si tienes segundo nombre en tu DNI</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="my-10 bg-primary/20 h-px" />

        {/* Sección de apellidos */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader
            title="Apellidos"
            description="Como aparecen en tu DNI"
          />

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
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                      field.onChange(value.toUpperCase());
                    }}
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
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                      field.onChange(value.toUpperCase());
                    }}
                  />
                  <FormDescription>Apellido materno, si lo tienes</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="my-10 bg-primary/20 h-px" />

        {/* Sección de código de verificación */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader
            title="Código de verificación"
            description="Los 3 dígitos de tu DNI"
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="verificationCode"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>Código de verificación</FormLabel>
                  <Input
                    placeholder="123"
                    {...field}
                    className="w-full font-mono text-lg"
                    maxLength={3}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      field.onChange(value);
                    }}
                  />
                  <FormDescription>
                    Los 3 dígitos que aparecen en la parte inferior de tu DNI
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Error de verificación */}
        {verificationError && (
          <>
            <Separator className="my-10 bg-primary/20 h-px" />
            <div 
              data-error="verification"
              className="rounded-lg border border-destructive/20 bg-destructive/5 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 text-destructive mt-0.5 shrink-0">⚠</div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">Error de verificación</p>
                  <p className="text-sm text-destructive/80">{verificationError}</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="font-medium">Consejos para resolver el problema:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Verifica que todos los datos coincidan exactamente con tu DNI físico</li>
                      <li>Asegúrate de escribir los nombres y apellidos en mayúsculas</li>
                      <li>Revisa que el código de verificación sean los 3 dígitos correctos</li>
                      <li>Si el problema persiste, contacta con soporte</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <Separator className="my-10 bg-primary/20 h-px" />

        {/* Botones de acción */}
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
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verificar datos
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );

  if (dashboardMode) {
    return (
      <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 xl:items-start xl:justify-center max-w-7xl mx-auto">
        <div className="flex-1 xl:max-w-2xl">
          {content}
          <StickyBottomBar
            ctaLabel={isVerifying ? "Verificando..." : "Verificar datos"}
            onCta={form.handleSubmit(onSubmit)}
            loading={isVerifying}
          />
        </div>

        {/* Card de ayuda - Mobile abajo, Desktop a la derecha */}
        <div className="xl:flex-shrink-0">
          <DNIHelpCard />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 xl:items-start xl:justify-center max-w-7xl mx-auto">
      {/* Formulario principal */}
      <div className="flex-1 xl:max-w-2xl">
        <Card className="w-full">
          <CardHeader className="pb-4">
            <FormHeader
              icon={currentStep?.icon || CreditCard}
              title="Verificación de identidad"
              description="Ingresa tus datos exactamente como aparecen en tu DNI"
            />
          </CardHeader>
          <CardContent className="pt-0">
            {content}
          </CardContent>
        </Card>
      </div>

      {/* Card de ayuda - Mobile abajo, Desktop a la derecha */}
      <div className="xl:flex-shrink-0">
        <DNIHelpCard />
      </div>
    </div>
  );
}

// Componente separado para la card de ayuda
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
          {/* DNI simulado - proporción 1.58:1 */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-lg shadow-lg text-white aspect-[1.58/1] flex flex-col justify-between p-4 relative overflow-hidden">
            {/* Efecto de sello de agua */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-bold">
                PERÚ
              </div>
            </div>

            {/* Contenido del DNI */}
            <div className="relative z-10 space-y-2">
              <div>
                <span className="text-[9px] opacity-70 block mb-0.5">DOCUMENTO NACIONAL DE IDENTIDAD</span>
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

            {/* Código de verificación en la parte inferior */}
            <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/30">
              <span className="text-[9px] opacity-70">CÓDIGO DE VERIFICACIÓN</span>
              <span className="bg-orange-400 text-orange-900 px-2 py-1 rounded font-mono font-bold text-xs shadow-sm">
                123
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}