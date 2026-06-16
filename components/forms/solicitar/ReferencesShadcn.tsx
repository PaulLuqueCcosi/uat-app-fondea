'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Users, CheckCircle2 } from 'lucide-react';
import { getCurrentStep } from '@/lib/funnel-steps';
import { useState, useEffect } from 'react';
import {
  ReferencesProfileStatus,
  ReferencesProfile,
  FamilyRelationship,
  NonFamilyRelationship,
} from '@/lib/types';

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
import { saveReferencesProfile } from '@/app/actions/references.actions';
import type { ReferencesSaveResult } from '@/app/actions/references.actions';
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

interface FunnelReferencesProps {
  dashboardMode?: boolean;
  initialData?: ReferencesProfileStatus;
}

const FAMILY_RELATIONS = [
  { value: 'MADRE',    label: 'Madre' },
  { value: 'PADRE',    label: 'Padre' },
  { value: 'HERMANO',  label: 'Hermano/a' },
  { value: 'HIJO',     label: 'Hijo/a' },
  { value: 'CONYUGE',  label: 'Cónyuge' },
  { value: 'TIO',      label: 'Tío/a' },
  { value: 'PRIMO',    label: 'Primo/a' },
  { value: 'ABUELO',   label: 'Abuelo/a' },
  { value: 'OTRO',     label: 'Otro' },
];

const NON_FAMILY_RELATIONS = [
  { value: 'COLEGA',    label: 'Colega' },
  { value: 'AMIGO',     label: 'Amigo/a' },
  { value: 'VECINO',    label: 'Vecino/a' },
  { value: 'CONOCIDO',  label: 'Conocido/a' },
  { value: 'OTRO',      label: 'Otro' },
];

/** Devuelve el label legible de una relación, usando relationship_other si es OTRO */
function getRelationLabel(
  relationship: string | undefined,
  relationship_other: string | undefined,
  options: { value: string; label: string }[]
): string {
  if (!relationship) return '—';
  if (relationship === 'OTRO') return relationship_other?.trim() || 'Otro';
  return options.find(o => o.value === relationship)?.label ?? relationship;
}

const referencesFormSchema = z.object({
  // Referencia Familiar
  family_name: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .refine((val) => val.trim().split(/\s+/).length >= 2, {
      message: 'Ingresa al menos nombre y apellido',
    }),
  family_relation: z.string().min(1, 'Selecciona la relación'),
  family_relation_other: z.string().optional(),
  family_phone: z
    .string()
    .min(9, 'El teléfono debe tener 9 dígitos')
    .max(9, 'El teléfono debe tener 9 dígitos')
    .regex(/^9\d{8}$/, 'Debe comenzar con 9 y tener 9 dígitos'),

  // Referencia No Familiar
  non_family_name: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .refine((val) => val.trim().split(/\s+/).length >= 2, {
      message: 'Ingresa al menos nombre y apellido',
    }),
  non_family_relation: z.string().min(1, 'Selecciona la relación'),
  non_family_relation_other: z.string().optional(),
  non_family_phone: z
    .string()
    .min(9, 'El teléfono debe tener 9 dígitos')
    .max(9, 'El teléfono debe tener 9 dígitos')
    .regex(/^9\d{8}$/, 'Debe comenzar con 9 y tener 9 dígitos'),
  years_known: z
    .string()
    .min(1, 'Ingresa los años')
    .refine((val) => Number(val) >= 1, {
      message: 'Debe ser al menos 1 año',
    }),
}).superRefine((data, ctx) => {
  // Texto libre requerido cuando se elige OTRO
  if (data.family_relation === 'OTRO' && !data.family_relation_other?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Especifica la relación', path: ['family_relation_other'] });
  }
  if (data.non_family_relation === 'OTRO' && !data.non_family_relation_other?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Especifica la relación', path: ['non_family_relation_other'] });
  }
  // Teléfonos no pueden ser iguales
  if (data.family_phone === data.non_family_phone) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Los teléfonos no pueden ser iguales', path: ['non_family_phone'] });
  }
});

type ReferencesFormValues = z.infer<typeof referencesFormSchema>;

// ── Componente auxiliar: spinner para botones ────────────────────────────────
function ButtonSpinner({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span role="status" aria-label="Cargando" className="block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
      <span>{label}</span>
    </span>
  );
}

export function FunnelReferencesShadcn({ dashboardMode = false, initialData }: FunnelReferencesProps) {
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
  const [savedProfile, setSavedProfile] = useState<ReferencesProfile & { verified?: boolean } | null>(initialData?.profile ?? null);

  // Status local — se actualiza después de submit exitoso
  const [localStatus, setLocalStatus] = useState(initialData?.status);
  const isExpired = localStatus === 'EXPIRED';

  // Forzar modo edición si está expirado (solo si no está verificado)
  useEffect(() => {
    if (isExpired && !isEditing && !isVerified) {
      setIsEditing(true);
    }
  }, [isExpired, isEditing, isVerified]);

  const nextPath = currentStep?.nextPath || '/solicitar/additional';
  const autoNavigate = useAutoNavigate(() => router.push(nextPath));

  const prevProfile = initialData?.profile;

  const form = useForm<ReferencesFormValues>({
    resolver: zodResolver(referencesFormSchema),
    defaultValues: {
      family_name: prevProfile?.family_reference.name || '',
      family_relation: prevProfile?.family_reference.relationship || '',
      family_relation_other: prevProfile?.family_reference.relationship_other || '',
      family_phone: prevProfile?.family_reference.phone || '',
      non_family_name: prevProfile?.non_family_reference.name || '',
      non_family_relation: prevProfile?.non_family_reference.relationship || '',
      non_family_relation_other: prevProfile?.non_family_reference.relationship_other || '',
      non_family_phone: prevProfile?.non_family_reference.phone || '',
      years_known: prevProfile?.non_family_reference.years_known ? String(prevProfile.non_family_reference.years_known) : '',
    },
  });

  const watchFamilyRelation = form.watch('family_relation');
  const watchNonFamilyRelation = form.watch('non_family_relation');
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

  const onSubmit = async (data: ReferencesFormValues) => {
    setSaveError(null);
    setSaveErrorCategory(undefined);
    setBlocked(false);
    setBlockedHoursLeft(0);
    setAttemptsLeft(undefined);
    setMaxAttempts(undefined);

    const referencesProfile = {
      family_reference: {
        name: data.family_name,
        phone: data.family_phone,
        relationship: data.family_relation as FamilyRelationship,
        relationship_other: data.family_relation === 'OTRO' ? data.family_relation_other : undefined,
      },
      non_family_reference: {
        name: data.non_family_name,
        phone: data.non_family_phone,
        relationship: data.non_family_relation as NonFamilyRelationship,
        relationship_other: data.non_family_relation === 'OTRO' ? data.non_family_relation_other : undefined,
        years_known: Number(data.years_known),
      },
    };

    const result: ReferencesSaveResult = await saveReferencesProfile(referencesProfile);

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
      family_reference: {
        name: data.family_name,
        phone: data.family_phone,
        relationship: data.family_relation as FamilyRelationship,
        relationship_other: data.family_relation === 'OTRO' ? data.family_relation_other : undefined,
      },
      non_family_reference: {
        name: data.non_family_name,
        phone: data.non_family_phone,
        relationship: data.non_family_relation as NonFamilyRelationship,
        relationship_other: data.non_family_relation === 'OTRO' ? data.non_family_relation_other : undefined,
        years_known: Number(data.years_known),
      },
      verified: true,
    });

    setIsVerified(true);
    setIsEditing(false);
    setLocalStatus('VERIFIED');

    if (!dashboardMode) {
      autoNavigate.start();
    }
  };

  // ── Vista readonly (datos guardados) ────────────────────────────────────────
  const familyRelationLabel = getRelationLabel(
    savedProfile?.family_reference.relationship,
    savedProfile?.family_reference.relationship_other,
    FAMILY_RELATIONS
  );
  const nonFamilyRelationLabel = getRelationLabel(
    savedProfile?.non_family_reference.relationship,
    savedProfile?.non_family_reference.relationship_other,
    NON_FAMILY_RELATIONS
  );

  const verifiedView = (
    <div className="space-y-6">
      <VerifiedBanner
        title="Referencias guardadas"
        description="Tus referencias están registradas. Puedes editarlas si algo cambió."
        onEdit={handleEdit}
      />

      {/* Referencias en 2 columnas */}
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2"></div>

        {/* Referencia Familiar */}
        <div>
          <h3 className="text-sm font-semibold text-primary mb-3">Referencia Familiar</h3>
          <div className="space-y-4">
            <DataRow label="Nombre completo" value={savedProfile?.family_reference.name} />
            <DataRow label="Relación" value={familyRelationLabel} />
            <DataRow label="Teléfono" value={savedProfile?.family_reference.phone ? `+51 ${savedProfile.family_reference.phone}` : '—'} />
          </div>
        </div>

        {/* Referencia No Familiar */}
        <div>
          <h3 className="text-sm font-semibold text-primary mb-3">Referencia No Familiar</h3>
          <div className="space-y-4">
            <DataRow label="Nombre completo" value={savedProfile?.non_family_reference.name} />
            <DataRow label="Relación" value={nonFamilyRelationLabel} />
            <DataRow label="Teléfono" value={savedProfile?.non_family_reference.phone ? `+51 ${savedProfile.non_family_reference.phone}` : '—'} />
            <DataRow label="Años de conocerse" value={savedProfile?.non_family_reference.years_known ? `${savedProfile.non_family_reference.years_known} ${savedProfile.non_family_reference.years_known === 1 ? 'año' : 'años'}` : '—'} />
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

        {/* Referencias en 2 columnas */}
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Separador vertical - centrado entre las columnas */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-primary/20 -translate-x-1/2"></div>

          {/* Columna 1: Referencia Familiar */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-primary">Referencia Familiar</h3>
              <p className="text-muted-foreground text-sm">Un familiar directo</p>
            </div>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="family_name"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel>Nombre completo</FormLabel>
                    <Input placeholder="María García López" {...field} className="w-full" />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="family_relation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel>Relación</FormLabel>
                    <NativeSelect {...field} className="w-full">
                      <NativeSelectOption value="">Selecciona</NativeSelectOption>
                      {FAMILY_RELATIONS.map((opt) => (
                        <NativeSelectOption key={opt.value} value={opt.value}>
                          {opt.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchFamilyRelation === 'OTRO' && (
                <FormField
                  control={form.control}
                  name="family_relation_other"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-1">
                      <FormLabel>Especifica la relación</FormLabel>
                      <Input placeholder="Ej: Cuñado, Padrino..." {...field} className="w-full" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="family_phone"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel>Teléfono</FormLabel>
                    <div className="relative w-full">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-sm font-medium">🇵🇪 +51</span>
                      </div>
                      <Input
                        type="tel"
                        placeholder="956123456"
                        {...field}
                        className="w-full pl-20"
                        maxLength={9}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, '');
                          field.onChange(cleaned);
                        }}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Columna 2: Referencia No Familiar */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-primary">Referencia No Familiar</h3>
              <p className="text-muted-foreground text-sm">Colega, amigo o vecino</p>
            </div>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="non_family_name"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel>Nombre completo</FormLabel>
                    <Input placeholder="Carlos Ruiz" {...field} className="w-full" />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="non_family_relation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel>Relación</FormLabel>
                    <NativeSelect {...field} className="w-full">
                      <NativeSelectOption value="">Selecciona</NativeSelectOption>
                      {NON_FAMILY_RELATIONS.map((opt) => (
                        <NativeSelectOption key={opt.value} value={opt.value}>
                          {opt.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchNonFamilyRelation === 'OTRO' && (
                <FormField
                  control={form.control}
                  name="non_family_relation_other"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-1">
                      <FormLabel>Especifica la relación</FormLabel>
                      <Input placeholder="Ej: Compañero de gym, Mentor..." {...field} className="w-full" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="non_family_phone"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel>Teléfono</FormLabel>
                    <div className="relative w-full">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-sm font-medium">🇵🇪 +51</span>
                      </div>
                      <Input
                        type="tel"
                        placeholder="987789012"
                        {...field}
                        className="w-full pl-20"
                        maxLength={9}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, '');
                          field.onChange(cleaned);
                        }}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="years_known"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel>¿Hace cuántos años se conocen?</FormLabel>
                    <Input type="number" placeholder="5" {...field} className="w-full" min="1" step="1" />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
        <div className="max-w-4xl mx-auto">
          <Card className="w-full">
            <CardHeader className="pb-4">
              <FormHeader
                icon={Users}
                title="Referencias personales"
                description={
                  isVerified && !isEditing
                    ? 'Tus referencias están registradas'
                    : 'Agrega un contacto familiar y uno no familiar'
                }
              />
            </CardHeader>
            <CardContent className="pt-0">
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
                ⚠️ ¿Editar referencias?
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
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="pb-4">
          <FormHeader
            icon={currentStep?.icon || Users}
            title="Referencias personales"
            description={
              isVerified && !isEditing
                ? 'Tus referencias están registradas'
                : isExpired && !isEditing
                ? 'Tu verificación ha expirado, debes validar nuevamente'
                : 'Necesitamos al menos 2 referencias de personas que te conozcan'
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
              ⚠️ ¿Editar referencias?
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
