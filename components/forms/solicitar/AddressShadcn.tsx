'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MapPin, Map } from 'lucide-react';
import { getCurrentStep } from '@/lib/funnel-steps';

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
import { REFERRAL_SOURCE_OPTIONS } from '@/lib/constants';
import {
  getDepartamentosAction,
  getProvinciasAction,
  getDistritosAction,
  type UbigeoOption,
} from '@/app/actions/ubigeo.actions';
import { GoogleAddressAutocomplete } from '@/components/forms/solicitar/GoogleAddressAutocomplete';
import type { AddressDetail } from '@/app/actions/address.actions';

interface FunnelAddressProps {
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

const addressFormSchema = z.object({
  address_type: z.enum(['google', 'manual']),

  // Para autocompletado de Google
  google_address: z.string().optional(),

  // Para ingreso manual
  street_address: z.string().optional(),
  region: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),

  // Canal de marketing
  referral_source: z.string().min(1, 'Selecciona cómo nos conociste'),
  referral_other: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.address_type === 'google') {
    if (!data.google_address || data.google_address.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ingresa tu dirección',
        path: ['google_address'],
      });
    }
  }

  if (data.address_type === 'manual') {
    if (!data.street_address || data.street_address.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ingresa la calle y número',
        path: ['street_address'],
      });
    }
    if (!data.region) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona la región',
        path: ['region'],
      });
    }
    if (!data.province) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona la provincia',
        path: ['province'],
      });
    }
    if (!data.district) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona el distrito',
        path: ['district'],
      });
    }
  }

  // Validar referral_other cuando se selecciona OTRO
  if (data.referral_source === 'OTRO' && (!data.referral_other || data.referral_other.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Especifica cómo nos conociste',
      path: ['referral_other'],
    });
  }
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

export function FunnelAddressShadcn({ dashboardMode = false }: FunnelAddressProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentStep = getCurrentStep(pathname);

  // ── Estado ubigeo ───────────────────────────────────────────────────────────
  const [departamentos, setDepartamentos] = useState<UbigeoOption[]>([]);
  const [provincias, setProvincias]       = useState<UbigeoOption[]>([]);
  const [distritos, setDistritos]         = useState<UbigeoOption[]>([]);

  // Carga inicial de departamentos
  useEffect(() => {
    getDepartamentosAction().then(setDepartamentos);
  }, []);

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      address_type: 'google',
      google_address: '',
      street_address: '',
      region: '',
      province: '',
      district: '',
      referral_source: '',
      referral_other: '',
    },
  });

  const addressType = form.watch('address_type');
  const watchedRegion = form.watch('region');
  const referralSource = form.watch('referral_source');

  const onSubmit = async (data: AddressFormValues) => {
    const addressData = {
      addressType: data.address_type,
      googleAddress: data.google_address || '',
      streetAddress: data.street_address || '',
      region: data.region || '',
      province: data.province || '',
      district: data.district || '',
      referral_source: data.referral_source,
      referral_other: data.referral_source === 'OTRO' ? data.referral_other : undefined,
    };

    console.log('Address data:', addressData);
    // await saveAddress(addressData);

    if (dashboardMode) {
      router.push('/dashboard');
    } else {
      router.push(currentStep?.nextPath || '/solicitar/loan-request');
    }
  };

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        {/* Selector de tipo de ingreso */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader
            title="Método de ingreso"
            description="Elige cómo ingresar tu dirección"
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="address_type"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => field.onChange('google')}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        field.value === 'google'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Map className="w-5 h-5 mb-2 text-primary" />
                      <p className="font-medium text-sm">Con Google</p>
                      <p className="text-xs text-muted-foreground mt-1">Autocompletado rápido</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange('manual')}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        field.value === 'manual'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <MapPin className="w-5 h-5 mb-2 text-primary" />
                      <p className="font-medium text-sm">Manual</p>
                      <p className="text-xs text-muted-foreground mt-1">Ingreso por campos</p>
                    </button>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="my-10 bg-primary/20 h-px" />

        {/* Formulario según el tipo seleccionado */}
        {addressType === 'google' ? (
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <SectionHeader
              title="Dirección"
              description="Busca tu dirección con Google"
            />

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="google_address"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel>Dirección completa</FormLabel>
                    <GoogleAddressAutocomplete
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onAddressSelected={(detail: AddressDetail) => {
                        // Cuando tengas el backend, aquí puedes pre-rellenar
                        // otros campos del form con los datos del detalle:
                        // form.setValue('street_address', detail.street);
                        // etc.
                        console.log('[Google Address] Detalle seleccionado:', detail);
                      }}
                      error={!!form.formState.errors.google_address}
                    />
                    <FormDescription>
                      Escribe tu dirección y selecciona de las sugerencias
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <SectionHeader
              title="Dirección"
              description="Ingresa tu dirección manualmente"
            />

            <div className="space-y-8 md:col-span-2">
              <FormField
                control={form.control}
                name="street_address"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel>Calle y número</FormLabel>
                    <Input
                      placeholder="Av. Javier Prado 1234, Dpto 501"
                      {...field}
                      className="w-full"
                    />
                    <FormDescription>Incluye referencia o número de departamento</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel>Departamento</FormLabel>
                    <NativeSelect
                      {...field}
                      className="w-full"
                      onChange={(e) => {
                        field.onChange(e);
                        form.setValue('province', '');
                        form.setValue('district', '');
                        setProvincias([]);
                        setDistritos([]);
                        if (e.target.value) {
                          getProvinciasAction(e.target.value).then(setProvincias);
                        }
                      }}
                    >
                      <NativeSelectOption value="">Selecciona el departamento</NativeSelectOption>
                      {departamentos.map((opt) => (
                        <NativeSelectOption key={opt.value} value={opt.value}>
                          {opt.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedRegion && (
                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-1">
                      <FormLabel>Provincia</FormLabel>
                      <NativeSelect
                        {...field}
                        className="w-full"
                        onChange={(e) => {
                          field.onChange(e);
                          form.setValue('district', '');
                          setDistritos([]);
                          if (e.target.value) {
                            getDistritosAction(e.target.value).then(setDistritos);
                          }
                        }}
                      >
                        <NativeSelectOption value="">Selecciona la provincia</NativeSelectOption>
                        {provincias.map((opt) => (
                          <NativeSelectOption key={opt.value} value={opt.value}>
                            {opt.label}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchedRegion && form.watch('province') && (
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-1">
                      <FormLabel>Distrito</FormLabel>
                      <NativeSelect {...field} className="w-full">
                        <NativeSelectOption value="">Selecciona el distrito</NativeSelectOption>
                        {distritos.map((opt) => (
                          <NativeSelectOption key={opt.value} value={opt.value}>
                            {opt.label}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
        )}

        <Separator className="my-10 bg-primary/20 h-px" />

        {/* Canal de conocimiento */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader
            title="¿Cómo nos conociste?"
            description="Ayúdanos a mejorar nuestro servicio"
          />

          <div className="space-y-8 md:col-span-2">
            <FormField
              control={form.control}
              name="referral_source"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>¿De dónde nos conociste?</FormLabel>
                  <NativeSelect {...field} className="w-full">
                    <NativeSelectOption value="">Selecciona una opción</NativeSelectOption>
                    {REFERRAL_SOURCE_OPTIONS.map((opt) => (
                      <NativeSelectOption key={opt.value} value={opt.value}>
                        {opt.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FormDescription>Esta información nos ayuda a mejorar</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {referralSource === 'OTRO' && (
              <FormField
                control={form.control}
                name="referral_other"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel>Especifica cómo</FormLabel>
                    <Input
                      placeholder="Ej: Evento, recomendación, etc."
                      {...field}
                      className="w-full"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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
          icon={currentStep?.icon || MapPin}
          title="Información de dirección"
          description="Ingresa tu dirección actual de residencia"
        />
      </CardHeader>
      <CardContent className="pt-0">
        {content}
      </CardContent>
    </Card>
  );
}
