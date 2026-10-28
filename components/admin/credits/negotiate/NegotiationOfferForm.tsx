'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Handshake, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
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
import { formatCurrency } from '@/lib/admin-formatters';

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

/** Pasa un monto a centavos enteros para sumar y repartir sin errores de redondeo. */
const toCents = (value: number) => Math.round(value * 100);

/**
 * Sugiere un cronograma inicial: N cuotas mensuales iguales que suman exactamente el pendiente.
 * Se reparte en centavos; lo que sobra por redondeo va a la última cuota.
 */
function buildSuggestedSchedule(outstanding: number, installments: number): { dueDate: string; amount: string }[] {
  const totalCents = toCents(outstanding);
  const baseCents = Math.floor(totalCents / installments);
  const rows: { dueDate: string; amount: string }[] = [];
  let accumulated = 0;
  for (let i = 1; i <= installments; i++) {
    const cents = i === installments ? totalCents - accumulated : baseCents;
    accumulated += cents;
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    // Fecha LOCAL (no toISOString, que pasa a UTC y en Perú corre un día después de las 19:00)
    const dueDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    rows.push({ dueDate, amount: (cents / 100).toFixed(2) });
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

  const [parts, setParts] = useState('3');

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'schedule',
  });

  const isSubmitting = form.formState.isSubmitting;

  const scheduleTotal = form.watch('schedule').reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  // Diferencia en centavos: el cronograma tiene que cuadrar con lo que debe la cuota, al centavo.
  const diffCents = toCents(scheduleTotal) - toCents(outstanding);
  const totalDiffersFromOutstanding = diffCents !== 0;

  function splitEvenly() {
    const n = Math.min(24, Math.max(1, Math.floor(Number(parts)) || 1));
    setParts(String(n));
    replace(buildSuggestedSchedule(outstanding, n));
  }

  /** Suma o resta la diferencia a la última cuota para que el cronograma cuadre con lo que debe la cuota. */
  function adjustLast() {
    const rows = form.getValues('schedule');
    const last = rows.length - 1;
    const fixed = toCents(Number(rows[last].amount) || 0) - diffCents;
    if (fixed > 0) form.setValue(`schedule.${last}.amount`, (fixed / 100).toFixed(2), { shouldValidate: true });
  }

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
            <CardDescription>
              Días que tiene el cliente para firmar. Pasado ese plazo la oferta vence y la cuota sigue vencida.
            </CardDescription>
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
                  <FormDescription>El cliente ve la oferta en su panel hasta que venza.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Cronograma */}
        <Card>
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-sm">Nuevo cronograma de pagos</CardTitle>
              <CardDescription>
                Estas serán las cuotas del crédito de negociación. Hoy la cuota debe {formatCurrency(outstanding)}.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-end gap-2 pt-2">
              <div className="space-y-1">
                <label htmlFor="negotiation-parts" className="text-xs text-muted-foreground">Repartir en</label>
                <Input
                  id="negotiation-parts"
                  type="number"
                  min={1}
                  max={24}
                  className="h-8 w-20"
                  value={parts}
                  onChange={(e) => setParts(e.target.value)}
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={splitEvenly}>
                cuotas iguales
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => append({ dueDate: '', amount: '' })}
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar una cuota
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
                          <Input type="number" step="0.01" min={0} className="pl-8" {...f} />
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

            {totalDiffersFromOutstanding ? (
              <Alert>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-700">
                  El cronograma suma {formatCurrency(Math.abs(diffCents) / 100)} {diffCents < 0 ? 'menos' : 'más'} de lo que debe la cuota
                </AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    {diffCents < 0
                      ? 'El cliente pagaría menos de lo que debe hoy.'
                      : 'El cliente pagaría más de lo que debe hoy.'}{' '}
                    El sistema no valida este monto: es una decisión de la negociación, confírmala antes de enviar.
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={adjustLast}>
                    Ajustar la última cuota para que cuadre
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> El cronograma cuadra con lo que debe la cuota.
              </p>
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
            {isSubmitting ? 'Enviando oferta...' : 'Enviar oferta al cliente'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(`/admin/credits/${creditId}`)}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
