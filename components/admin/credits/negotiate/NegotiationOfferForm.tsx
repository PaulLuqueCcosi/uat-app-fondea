'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Handshake, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { createNegotiationOfferAction } from '@/app/actions/negotiation-offer.actions';

// ─── Schema ───────────────────────────────────────────────────────────────────

const scheduleEntrySchema = z.object({
  dueDate: z.string().min(1, 'Ingresa la fecha de vencimiento'),
  amount: z
    .string()
    .min(1, 'Ingresa el monto')
    .refine((v) => Number(v) > 0, { message: 'El monto debe ser mayor a 0' }),
});

const negotiationFormSchema = z.object({
  signDeadlineDays: z
    .string()
    .min(1, 'Ingresa los días de plazo')
    .refine((v) => Number(v) >= 1, { message: 'Debe ser al menos 1 día' }),
  schedule: z.array(scheduleEntrySchema).min(1, 'Agrega al menos una cuota al cronograma'),
}).superRefine((data, ctx) => {
  // Cada fecha debe ser posterior a la anterior — evita cronogramas fuera de orden
  for (let i = 1; i < data.schedule.length; i++) {
    const prev = data.schedule[i - 1].dueDate;
    const curr = data.schedule[i].dueDate;
    if (prev && curr && new Date(curr) <= new Date(prev)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe ser posterior a la cuota anterior',
        path: ['schedule', i, 'dueDate'],
      });
    }
  }
});

type NegotiationFormValues = z.infer<typeof negotiationFormSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
}

/** Sugiere un cronograma inicial simple: N cuotas mensuales iguales que suman el pendiente */
function buildSuggestedSchedule(outstanding: number, installments: number): { dueDate: string; amount: string }[] {
  const base = Math.floor((outstanding / installments) * 10) / 10;
  const rows: { dueDate: string; amount: string }[] = [];
  let accumulated = 0;
  for (let i = 1; i <= installments; i++) {
    const isLast = i === installments;
    const amount = isLast ? Math.round((outstanding - accumulated) * 10) / 10 : base;
    accumulated += amount;
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    rows.push({ dueDate: date.toISOString().slice(0, 10), amount: amount.toFixed(1) });
  }
  return rows;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface NegotiationOfferFormProps {
  installmentId: string;
  creditId: string;
  outstanding: number;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function NegotiationOfferForm({ installmentId, creditId, outstanding }: NegotiationOfferFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<NegotiationFormValues>({
    resolver: zodResolver(negotiationFormSchema),
    defaultValues: {
      signDeadlineDays: '7',
      schedule: buildSuggestedSchedule(outstanding, 3).map((r) => ({ dueDate: r.dueDate, amount: r.amount })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'schedule',
  });

  const isSubmitting = form.formState.isSubmitting;

  const scheduleTotal = form.watch('schedule').reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const totalDiffersFromOutstanding = Math.abs(scheduleTotal - outstanding) > 0.5;

  async function onSubmit(data: NegotiationFormValues) {
    setSubmitError(null);

    const result = await createNegotiationOfferAction({
      installmentId,
      signDeadlineDays: Number(data.signDeadlineDays),
      schedule: data.schedule.map((row, idx) => ({
        installmentNo: idx + 1,
        dueDate: row.dueDate,
        amount: Number(row.amount),
      })),
    });

    if (!result.ok) {
      setSubmitError(result.error.message);
      return;
    }

    router.push(`/admin/negotiation-offers/${result.data.id}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Plazo de firma */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Plazo para firmar</CardTitle>
            <CardDescription>Días que tiene el cliente para aceptar esta oferta antes de que expire.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="signDeadlineDays"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>Días de plazo</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} placeholder="7" {...field} />
                  </FormControl>
                  <FormDescription>El cliente verá esta oferta en su dashboard hasta esa fecha.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Cronograma */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Cronograma propuesto</CardTitle>
                <CardDescription>
                  100% manual — define cada cuota. Pendiente actual de la cuota original: {formatCurrency(outstanding)}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => append({ dueDate: '', amount: '' })}
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar cuota
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Encabezados de columna — visibles desde md, evita repetir el label en cada fila */}
            <div className="hidden md:flex items-center gap-3 px-3">
              <span className="text-xs font-medium text-muted-foreground w-6 shrink-0">#</span>
              <span className="text-xs font-medium text-muted-foreground flex-1">Fecha de vencimiento</span>
              <span className="text-xs font-medium text-muted-foreground flex-1">Monto</span>
              <span className="w-9 shrink-0" />
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-3 rounded-lg border p-3">
                <span className="mt-2.5 text-xs font-mono text-muted-foreground w-6 shrink-0">#{index + 1}</span>

                <FormField
                  control={form.control}
                  name={`schedule.${index}.dueDate`}
                  render={({ field: f }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs md:hidden">Fecha de vencimiento</FormLabel>
                      <FormControl>
                        <Input type="date" {...f} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`schedule.${index}.amount`}
                  render={({ field: f }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs md:hidden">Monto</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">S/</span>
                          <Input type="number" step="0.1" min={0} className="pl-8" {...f} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-0.5 text-destructive hover:text-destructive"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {form.formState.errors.schedule?.root?.message && (
              <p className="text-xs font-medium text-destructive">{form.formState.errors.schedule.root.message}</p>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total del cronograma</span>
              <span className={`text-base font-semibold ${totalDiffersFromOutstanding ? 'text-amber-600' : 'text-foreground'}`}>
                {formatCurrency(scheduleTotal)}
              </span>
            </div>

            {totalDiffersFromOutstanding && (
              <Alert>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-700">El total no coincide con el pendiente actual</AlertTitle>
                <AlertDescription>
                  El cronograma suma {formatCurrency(scheduleTotal)}, pero la cuota original tiene {formatCurrency(outstanding)}{' '}
                  pendiente. El backend no valida esto — es una decisión de negociación con el cliente, pero confírmalo antes de enviar.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {submitError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No se pudo crear la oferta</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Handshake className="h-4 w-4" />}
            {isSubmitting ? 'Creando oferta...' : 'Crear oferta de negociación'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(`/admin/credits/${creditId}`)}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
