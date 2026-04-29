'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Users, UserCheck, Pencil, CheckCircle2 } from 'lucide-react';
import { getCurrentStep } from '@/lib/funnel-steps';
import { useState } from 'react';
import { ReferencesProfileStatus } from '@/lib/types';

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

interface FunnelReferencesProps {
  dashboardMode?: boolean;
  initialData?: ReferencesProfileStatus;
}

const FAMILY_RELATIONS = [
  { value: 'madre', label: 'Madre' },
  { value: 'padre', label: 'Padre' },
  { value: 'hermano', label: 'Hermano/a' },
  { value: 'hijo', label: 'Hijo/a' },
  { value: 'conyuge', label: 'Cónyuge' },
  { value: 'tio', label: 'Tío/a' },
  { value: 'primo', label: 'Primo/a' },
  { value: 'abuelo', label: 'Abuelo/a' },
  { value: 'otro_familiar', label: 'Otro familiar' },
];

const NON_FAMILY_RELATIONS = [
  { value: 'colega', label: 'Colega' },
  { value: 'amigo', label: 'Amigo/a' },
  { value: 'vecino', label: 'Vecino/a' },
  { value: 'conocido', label: 'Conocido/a' },
];

const referencesFormSchema = z.object({
  // Referencia Familiar
  family_name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  family_relation: z.string().min(1, 'Selecciona la relación'),
  family_phone: z
    .string()
    .min(9, 'El teléfono debe tener 9 dígitos')
    .max(9, 'El teléfono debe tener 9 dígitos')
    .regex(/^9\d{8}$/, 'Debe comenzar con 9 y tener 9 dígitos'),

  // Referencia No Familiar
  non_family_name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  non_family_relation: z.string().min(1, 'Selecciona la relación'),
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
  // Validar que los teléfonos no sean iguales
  if (data.family_phone === data.non_family_phone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Los teléfonos no pueden ser iguales',
      path: ['non_family_phone'],
    });
  }
});

type ReferencesFormValues = z.infer<typeof referencesFormSchema>;

function DataRow({ label, value }: { label: string; value?: string | number }) {
  const display = value === undefined || value === null || value === '' ? '—' : String(value);
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{display}</span>
    </div>
  );
}

export function FunnelReferencesShadcn({ dashboardMode = false, initialData }: FunnelReferencesProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentStep = getCurrentStep(pathname);

  const [isVerified, setIsVerified] = useState(initialData?.overall_verified === true);
  const [isEditing, setIsEditing] = useState(!initialData?.overall_verified);
  const [saveError, setSaveError] = useState<string | null>(null);

  const prevProfile = initialData?.profile;

  const form = useForm<ReferencesFormValues>({
    resolver: zodResolver(referencesFormSchema),
    defaultValues: {
      family_name: prevProfile?.family_reference.name || '',
      family_relation: prevProfile?.family_reference.relationship || '',
      family_phone: prevProfile?.family_reference.phone || '',
      non_family_name: prevProfile?.non_family_reference.name || '',
      non_family_relation: prevProfile?.non_family_reference.relationship || '',
      non_family_phone: prevProfile?.non_family_reference.phone || '',
      years_known: prevProfile?.non_family_reference.years_known ? String(prevProfile.non_family_reference.years_known) : '',
    },
  });

  const handleEdit = () => {
    setIsVerified(false);
    setIsEditing(true);
    setSaveError(null);
  };

  const onSubmit = async (data: ReferencesFormValues) => {
    setSaveError(null);
    try {
      const referencesProfile = {
        family_reference: {
          name: data.family_name,
          phone: data.family_phone,
          relationship: data.family_relation,
        },
        non_family_reference: {
          name: data.non_family_name,
          phone: data.non_family_phone,
          relationship: data.non_family_relation,
          years_known: Number(data.years_known),
        },
      };

      const result = await saveReferencesProfile(referencesProfile);

      if (!result.success) {
        setSaveError(result.error || 'Error al guardar los datos.');
        return;
      }

      setIsVerified(true);
      setIsEditing(false);

      if (!dashboardMode) {
        router.push(currentStep?.nextPath || '/solicitar/additional');
      }
    } catch {
      setSaveError('Error de conexión. Por favor, inténtalo nuevamente.');
    }
  };

  // ── Vista readonly (datos guardados) ────────────────────────────────────────
  const familyRelationLabel = FAMILY_RELATIONS.find(r => r.value === prevProfile?.family_reference.relationship)?.label ?? '—';
  const nonFamilyRelationLabel = NON_FAMILY_RELATIONS.find(r => r.value === prevProfile?.non_family_reference.relationship)?.label ?? '—';

  const verifiedView = (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-secondary">Referencias guardadas</p>
          <p className="text-xs text-muted-foreground">
            Tus referencias están registradas. Puedes editarlas si algo cambió.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleEdit} className="shrink-0 gap-1.5">
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
      </div>

      {/* Referencias en 2 columnas */}
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2"></div>

        {/* Referencia Familiar */}
        <div>
          <h3 className="text-sm font-semibold text-primary mb-3">Referencia Familiar</h3>
          <div className="space-y-4">
            <DataRow label="Nombre completo" value={prevProfile?.family_reference.name} />
            <DataRow label="Relación" value={familyRelationLabel} />
            <DataRow label="Teléfono" value={prevProfile?.family_reference.phone ? `+51 ${prevProfile.family_reference.phone}` : '—'} />
          </div>
        </div>

        {/* Referencia No Familiar */}
        <div>
          <h3 className="text-sm font-semibold text-primary mb-3">Referencia No Familiar</h3>
          <div className="space-y-4">
            <DataRow label="Nombre completo" value={prevProfile?.non_family_reference.name} />
            <DataRow label="Relación" value={nonFamilyRelationLabel} />
            <DataRow label="Teléfono" value={prevProfile?.non_family_reference.phone ? `+51 ${prevProfile.non_family_reference.phone}` : '—'} />
            <DataRow label="Años de conocerse" value={prevProfile?.non_family_reference.years_known ? `${prevProfile.non_family_reference.years_known} ${prevProfile.non_family_reference.years_known === 1 ? 'año' : 'años'}` : '—'} />
          </div>
        </div>
      </div>

      {!dashboardMode && (
        <>
          <Separator className="bg-primary/20 h-px" />
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>Atrás</Button>
            <Button type="button" onClick={() => router.push(currentStep?.nextPath || '/solicitar/additional')}>
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

  // ── Formulario editable ──────────────────────────────────────────────────────
  const editForm = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        {saveError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-800">{saveError}</p>
          </div>
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
                    <Input type="number" placeholder="5" {...field} className="w-full" min="1" />
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <FormHeader
          icon={currentStep?.icon || Users}
          title="Referencias personales"
          description="Necesitamos al menos 2 referencias de personas que te conozcan"
        />
      </CardHeader>
      <CardContent className="pt-0">
        {content}
      </CardContent>
    </Card>
  );
}
