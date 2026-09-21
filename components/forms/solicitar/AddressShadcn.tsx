'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MapPin } from 'lucide-react';
import { getCurrentStep } from '@/lib/funnel-steps';
import dynamic from 'next/dynamic';
const LocationMapPicker = dynamic(
  () => import('@/components/forms/solicitar/LocationMapPicker').then((m) => m.LocationMapPicker),
  { ssr: false }
);

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
import { FormHeader } from '@/components/ui/form-header';
import { REFERRAL_SOURCE_OPTIONS } from '@/lib/constants';
import {
  getDepartamentosAction,
  getProvinciasAction,
  getDistritosAction,
  getUbigeoCoordinates,
  type UbigeoOption,
} from '@/app/actions/additional-address.actions';
import { saveAddressProfile, getAddressProfileStatus } from '@/app/actions/additional-address.actions';
import type { AddressProfileStatus } from '@/lib/types';
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

// ── Props ─────────────────────────────────────────────────────────────────────

interface FunnelAddressProps {
  dashboardMode?: boolean;
  initialData?: AddressProfileStatus;
  onClose?: () => void;
}

// ── Helpers UI ────────────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="font-semibold text-primary">{title}</h2>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

// ── Schema ────────────────────────────────────────────────────────────────────

const addressFormSchema = z.object({
  address_type: z.literal('manual'),
  street_address: z.string().optional(),
  region: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  referral_source: z.string().min(1, 'Selecciona cómo nos conociste'),
  referral_other: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.street_address?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ingresa la calle y número', path: ['street_address'] });
  }
  if (!data.region) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selecciona el departamento', path: ['region'] });
  }
  if (!data.province) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selecciona la provincia', path: ['province'] });
  }
  if (!data.district) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selecciona el distrito', path: ['district'] });
  }
  if (data.referral_source === 'OTRO' && !data.referral_other?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Especifica cómo nos conociste', path: ['referral_other'] });
  }
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

// ── Componente ────────────────────────────────────────────────────────────────

export function FunnelAddressShadcn({ dashboardMode = false, initialData, onClose }: FunnelAddressProps) {
  const router   = useRouter();
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
    moduleName: 'Dirección',
    dashboardMode,
  });

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(initialData?.profile?.location ?? null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Datos guardados en este submit — tienen prioridad sobre initialData para el readonly
  const [savedProfile, setSavedProfile] = useState(initialData?.profile ?? null);

  // Status local — se actualiza después de submit exitoso
  const [localStatus, setLocalStatus] = useState(initialData?.status);
  const isExpired = localStatus === 'EXPIRED';

  const nextPath = currentStep?.nextPath || '/solicitar/references';
  const autoNavigate = useAutoNavigate(() => router.push(nextPath));

  // ── Estado ubigeo ───────────────────────────────────────────────────────────
  const [departamentos,    setDepartamentos]    = useState<UbigeoOption[]>([]);
  const [provincias,       setProvincias]       = useState<UbigeoOption[]>([]);
  const [distritos,        setDistritos]        = useState<UbigeoOption[]>([]);

  // Labels resueltos para la vista resumen (nombre legible del ubigeo)
  const [labelDep,  setLabelDep]  = useState<string>('');
  const [labelProv, setLabelProv] = useState<string>('');
  const [labelDist, setLabelDist] = useState<string>('');

  // Carga inicial de departamentos
  useEffect(() => {
    getDepartamentosAction().then(setDepartamentos);
  }, []);

  // Si hay datos guardados, pre-carga las listas y resuelve los labels
  useEffect(() => {
    const p = initialData?.profile;
    if (!p) return;

    if (p.region) {
      getProvinciasAction(p.region).then((provs) => {
        setProvincias(provs);
        const found = provs.find((x) => x.value === p.province);
        if (found) setLabelProv(found.label);
      });
    }
    if (p.province) {
      getDistritosAction(p.province).then((dists) => {
        setDistritos(dists);
        const found = dists.find((x) => x.value === p.district);
        if (found) setLabelDist(found.label);
      });
    }
  }, [initialData]);

  // Efecto adicional para recargar ubigeo cuando se entra en modo edición
  // COMENTADO: Solo usaremos opción manual
  /*
  useEffect(() => {
    if (editControl.isEditing && initialData?.profile) {
      const p = initialData.profile;
      
      // Recargar provincias si hay región seleccionada
      if (p.region && provincias.length === 0) {
        getProvinciasAction(p.region).then(setProvincias);
      }
      
      // Recargar distritos si hay provincia seleccionada
      if (p.province && distritos.length === 0) {
        getDistritosAction(p.province).then(setDistritos);
      }
    }
  }, [editControl.isEditing, initialData, provincias.length, distritos.length]);
  */

  // Resuelve el label del departamento cuando la lista carga
  useEffect(() => {
    const p = initialData?.profile;
    if (!p?.region || departamentos.length === 0) return;
    const found = departamentos.find((x) => x.value === p.region);
    if (found) setLabelDep(found.label);
  }, [departamentos, initialData]);

  const isReplaced = initialData?.status === 'REPLACED';

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      address_type:    'manual',
      street_address:  isReplaced ? '' : (initialData?.profile?.street_address  ?? ''),
      region:          isReplaced ? '' : (initialData?.profile?.region          ?? ''),
      province:        isReplaced ? '' : (initialData?.profile?.province        ?? ''),
      district:        isReplaced ? '' : (initialData?.profile?.district        ?? ''),
      referral_source: isReplaced ? '' : (initialData?.profile?.referral_source ?? ''),
      referral_other:  isReplaced ? '' : (initialData?.profile?.referral_other  ?? ''),
    },
  });

  // Efecto para resetear el formulario cuando se entra en modo edición
  // Efecto para resetear el formulario cuando se entra en modo edición
  // (NO aplicar cuando es REPLACED — el form debe quedarse vacío)
  useEffect(() => {
    if (editControl.isEditing && initialData?.profile && initialData?.status !== 'REPLACED') {
      const profile = initialData.profile;
      form.reset({
        address_type:    'manual',
        street_address:  profile.street_address  ?? '',
        region:          profile.region          ?? '',
        province:        profile.province        ?? '',
        district:        profile.district        ?? '',
        referral_source: profile.referral_source ?? '',
        referral_other:  profile.referral_other  ?? '',
      });
      setLocation(profile.location ?? null);
      setLocationError(null);
    }
  }, [editControl.isEditing, initialData, form]);

  const watchedRegion  = form.watch('region');
  const referralSource = form.watch('referral_source');

  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapZoom, setMapZoom] = useState(6);

  // Actualizar centro del mapa cuando cambia la selección de ubigeo
  const watchedDistrict = form.watch('district');
  const watchedProvince = form.watch('province');

  useEffect(() => {
    async function updateMapCenter() {
      const coords = await getUbigeoCoordinates(
        watchedDistrict || undefined,
        watchedProvince || undefined,
        watchedRegion || undefined
      );
      if (coords) {
        setMapCenter(coords);
        // Zoom según nivel de detalle
        if (watchedDistrict) setMapZoom(14);
        else if (watchedProvince) setMapZoom(11);
        else if (watchedRegion) setMapZoom(8);
      }
    }
    if (watchedRegion) updateMapCenter();
  }, [watchedRegion, watchedProvince, watchedDistrict]);

  const summaryMapCenter = savedProfile?.location ?? null;
  const summaryMapZoom = 14;

  // ── Edit handlers ───────────────────────────────────────────────────────────

  const handleEdit = () => {
    editControl.requestEdit();
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const onSubmit = async (data: AddressFormValues) => {
    if (!editControl.requestSubmit()) return;
    await doSubmit(data);
  };

  const doSubmit = async (data: AddressFormValues) => {
    errorHandler.clear();
    setLocationError(null);

    const result = await errorHandler.execute(
      () => saveAddressProfile({
        address_type:    'manual',
        street_address:  data.street_address  || undefined,
        region:          data.region          ?? '',
        province:        data.province        ?? '',
        district:        data.district        ?? '',
        referral_source: data.referral_source,
        referral_other:  data.referral_source === 'OTRO' ? data.referral_other : undefined,
        location:        location ?? undefined,
      }),
      'Dirección guardada',
    );

    if (!result) return;

    // Actualiza labels para la vista resumen
    const dep  = departamentos.find((x) => x.value === data.region);
    const prov = provincias.find((x) => x.value === data.province);
    const dist = distritos.find((x) => x.value === data.district);
    if (dep)  setLabelDep(dep.label);
    if (prov) setLabelProv(prov.label);
    if (dist) setLabelDist(dist.label);

    setSavedProfile({
      address_type:    'manual',
      street_address:  data.street_address  || undefined,
      region:          data.region          ?? '',
      province:        data.province        ?? '',
      district:        data.district        ?? '',
      referral_source: data.referral_source,
      referral_other:  data.referral_source === 'OTRO' ? data.referral_other : undefined,
      location:        location ?? undefined,
      verified:        true,
    });
    editControl.confirmSaved();
    setLocalStatus('VERIFIED');

    if (!dashboardMode) {
      router.push(nextPath);
    }
  };

  // ── Vista resumen ───────────────────────────────────────────────────────────

  const referralLabel = REFERRAL_SOURCE_OPTIONS.find(
    (o) => o.value === (savedProfile?.referral_source ?? form.getValues('referral_source'))
  )?.label ?? savedProfile?.referral_source ?? '—';

  const summaryView = (
    <div className="space-y-6">
      {/* Banner verificado */}
      <VerifiedBanner
        title="Dirección guardada"
        description="Tu dirección está registrada. Puedes editarla si algo cambió."
        {...(editControl.canEdit ? { onEdit: handleEdit } : {})}
      />

      {/* Datos */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <DataRow label="Calle y número" value={savedProfile?.street_address} />
        <DataRow label="Departamento" value={labelDep || savedProfile?.region} />
        <DataRow label="Provincia"    value={labelProv || savedProfile?.province} />
        <DataRow label="Distrito"     value={labelDist || savedProfile?.district} />
        <DataRow label="¿Cómo nos conociste?" value={referralLabel} />
        {savedProfile?.referral_other && (
          <DataRow label="Especificación" value={savedProfile.referral_other} />
        )}
      </div>


      {/* Mapa en readonly */}
      {savedProfile?.location && (
        <div style={{ position: 'relative', zIndex: 0, isolation: 'isolate' }}>
          <p className="text-sm font-medium mb-2">Ubicación registrada</p>
          <LocationMapPicker
            value={savedProfile.location}
            onChange={() => {}}
            height={200}
            readOnly
            mapCenter={summaryMapCenter}
            mapZoom={summaryMapZoom}
          />
        </div>
      )}

      {/* Botones */}
      {!dashboardMode && (
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => router.back()}>
            Atrás
          </Button>
          <ContinueButton
            onClick={autoNavigate.navigateNow}
            active={autoNavigate.active}
            progress={autoNavigate.progress}
            countdown={autoNavigate.countdown}
            className="w-full sm:w-auto"
          />
        </div>
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

        {/* Dirección manual */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader title="Dirección" description="Ingresa tu dirección manualmente" />
          <div className="space-y-8 md:col-span-2">
            <FormField
              control={form.control}
              name="street_address"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>Calle y número *</FormLabel>
                  <Input placeholder="Av. Javier Prado 1234, Dpto 501" {...field} className="w-full" />
                  <FormDescription>Incluye referencia o número de departamento</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {renderUbigeoSelects()}

            <div style={{ position: 'relative', zIndex: 0, isolation: 'isolate' }}>
              <FormLabel className="mb-2 block">Ubicación en el mapa</FormLabel>
              <FormDescription className="mb-3">
                Haz clic en el mapa para marcar la ubicación aproximada de tu domicilio
              </FormDescription>
              <LocationMapPicker
                value={location}
                onChange={(coords) => { setLocation(coords); setLocationError(null); }}
                height={220}
                mapCenter={mapCenter}
                mapZoom={mapZoom}
              />
              {locationError && (
                <p className="text-sm text-destructive mt-1">{locationError}</p>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-10 bg-primary/20 h-px" />

        {/* ¿Cómo nos conociste? */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <SectionHeader title="¿Cómo nos conociste?" description="Ayúdanos a mejorar nuestro servicio" />
          <div className="space-y-8 md:col-span-2">
            <FormField
              control={form.control}
              name="referral_source"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>¿De dónde nos conociste? *</FormLabel>
                  <NativeSelect {...field} className="w-full">
                    <NativeSelectOption value="">Selecciona una opción</NativeSelectOption>
                    {REFERRAL_SOURCE_OPTIONS.map((opt) => (
                      <NativeSelectOption key={opt.value} value={opt.value}>{opt.label}</NativeSelectOption>
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
                    <FormLabel>Especifica cómo *</FormLabel>
                    <Input placeholder="Ej: Evento, recomendación, etc." {...field} className="w-full" />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        <Separator className="my-10 bg-primary/20 h-px" />

        {/* Error feedback centralizado */}
        <FormErrorFeedback handler={errorHandler} />

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          {editControl.isVerified ? (
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={dashboardMode && onClose ? onClose : () => { editControl.cancelEdit(); errorHandler.clear(); }}>
              Cancelar
            </Button>
          ) : (
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={dashboardMode && onClose ? onClose : () => router.back()}>
              {dashboardMode ? 'Cancelar' : 'Atrás'}
            </Button>
          )}
          <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting || errorHandler.state.blocked}>
            {form.formState.isSubmitting ? 'Guardando...' : editControl.isVerified ? 'Guardar cambios' : 'Continuar'}
          </Button>
        </div>
      </form>
    </Form>
  );

  // ── Selects ubigeo reutilizables ────────────────────────────────────────────

  function renderUbigeoSelects() {
    return (
      <>
        <FormField
          control={form.control}
          name="region"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel>Departamento *</FormLabel>
              <NativeSelect
                {...field}
                className="w-full"
                onChange={(e) => {
                  field.onChange(e);
                  form.setValue('province', '');
                  form.setValue('district', '');
                  setProvincias([]);
                  setDistritos([]);
                  if (e.target.value) getProvinciasAction(e.target.value).then(setProvincias);
                }}
              >
                <NativeSelectOption value="">Selecciona el departamento</NativeSelectOption>
                {departamentos.map((opt) => (
                  <NativeSelectOption key={opt.value} value={opt.value}>{opt.label}</NativeSelectOption>
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
                <FormLabel>Provincia *</FormLabel>
                <NativeSelect
                  {...field}
                  className="w-full"
                  onChange={(e) => {
                    field.onChange(e);
                    form.setValue('district', '');
                    setDistritos([]);
                    if (e.target.value) getDistritosAction(e.target.value).then(setDistritos);
                  }}
                >
                  <NativeSelectOption value="">Selecciona la provincia</NativeSelectOption>
                  {provincias.map((opt) => (
                    <NativeSelectOption key={opt.value} value={opt.value}>{opt.label}</NativeSelectOption>
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
                <FormLabel>Distrito *</FormLabel>
                <NativeSelect
                  {...field}
                  className="w-full"
                  onChange={(e) => {
                    field.onChange(e);
                  }}
                >
                  <NativeSelectOption value="">Selecciona el distrito</NativeSelectOption>
                  {distritos.map((opt) => (
                    <NativeSelectOption key={opt.value} value={opt.value}>{opt.label}</NativeSelectOption>
                  ))}
                </NativeSelect>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const content = editControl.isReadOnly ? summaryView : formView;

  return (
    <>
      {dashboardMode ? (
        <>
          <div className="max-w-3xl mx-auto">
            <Card className="w-full">
              <CardHeader className="pb-4">
                <FormHeader
                  icon={MapPin}
                  title="Dirección"
                  description={
                    editControl.isReadOnly
                      ? 'Tu dirección está registrada'
                      : 'Ingresa tu dirección actual de residencia'
                  }
                />
              </CardHeader>
              <CardContent className="pt-0">
                {content}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader className="pb-4">
            <FormHeader
              icon={currentStep?.icon || MapPin}
              title={currentStep?.title || "Dirección"}
              description={
                editControl.isReadOnly
                  ? 'Tu dirección está registrada'
                  : isExpired
                  ? 'Tu verificación ha expirado, debes validar nuevamente'
                  : 'Ingresa tu dirección actual de residencia'
              }
            />
          </CardHeader>
          <CardContent className="pt-0">
            {content}
          </CardContent>
        </Card>
      )}

      {/* Modal de confirmación al editar */}
      <FormEditPolicyDialog {...editControl.dialogProps} />
    </>
  );
}
