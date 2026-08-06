'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmAction } from '@/components/admin/shared/ConfirmAction';
import { CalendarDays, Loader2, Plus, Trash2, AlertTriangle, Repeat } from 'lucide-react';
import type { AdminHoliday } from '@/modules/admin/admin-complaint-holidays.types';
import { addComplaintHolidayAction, removeComplaintHolidayAction } from '@/app/actions/admin-complaint-holidays.actions';

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Fecha completa, con año — para feriados de una sola vez (Semana Santa, puentes). */
function formatOneOffDate(iso: string) {
  return capitalize(new Date(iso + 'T00:00:00').toLocaleDateString('es-PE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  }));
}

/** Solo mes y día, sin año — para feriados recurrentes, donde el año guardado no tiene significado. */
function formatRecurringDate(iso: string) {
  return capitalize(new Date(iso + 'T00:00:00').toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long',
  }));
}

/** MM-DD — usado para ordenar el calendario por mes/día independientemente del año. */
function monthDayKey(iso: string) {
  return iso.slice(5); // "YYYY-MM-DD" -> "MM-DD"
}

interface ComplaintHolidaysClientProps {
  initialHolidays: AdminHoliday[];
}

export function ComplaintHolidaysClient({ initialHolidays }: ComplaintHolidaysClientProps) {
  const router = useRouter();
  const [holidays, setHolidays] = useState(initialHolidays);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [recurring, setRecurring] = useState(true);

  const [toDelete, setToDelete] = useState<AdminHoliday | null>(null);

  const sorted = [...holidays].sort((a, b) => monthDayKey(a.date).localeCompare(monthDayKey(b.date)));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date || !description.trim()) {
      setError('Fecha y descripción son obligatorias.');
      return;
    }

    startTransition(async () => {
      const result = await addComplaintHolidayAction({ date, description: description.trim(), recurring });
      if (!result.ok || !result.data) {
        setError(result.message ?? 'No se pudo agregar el feriado.');
        return;
      }
      setHolidays((prev) => [...prev, result.data!]);
      setDate('');
      setDescription('');
      setRecurring(true);
      router.refresh();
    });
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const result = await removeComplaintHolidayAction(toDelete.id);
    if (!result.ok) {
      setError(result.message ?? 'No se pudo quitar el feriado.');
      return;
    }
    setHolidays((prev) => prev.filter((h) => h.id !== toDelete.id));
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Calendario de feriados
          </span>
        </CardTitle>
        <CardDescription>
          Días no laborables usados para calcular el plazo legal de 15 días hábiles (Ley 31435/32495) de las reclamaciones.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-start gap-2 rounded-lg bg-warning-50 border border-warning-100 px-3 py-2 text-xs text-warning-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          Los feriados <strong>recurrentes</strong> (la mayoría — Año Nuevo, Fiestas Patrias, Navidad, etc.) se aplican
          automáticamente todos los años, no hace falta volver a cargarlos. Semana Santa (depende de la fecha de Pascua,
          cambia cada año) y los días no laborables puntuales que decreta el Ejecutivo ("puente") deben marcarse
          <strong> sin recurrencia</strong> y agregarse a mano cada año.
        </div>

        {/* Agregar feriado */}
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="space-y-1.5 w-full sm:w-44">
              <Label className="text-sm font-medium">Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={isPending} className="h-9" />
            </div>
            <div className="space-y-1.5 flex-1 w-full">
              <Label className="text-sm font-medium">Descripción</Label>
              <Input
                placeholder="Ej: Día no laborable decretado — Fiestas Patrias"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
                className="h-9"
              />
            </div>
            <Button type="submit" disabled={isPending} className="gap-1.5 h-9 shrink-0">
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Agregar
            </Button>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer w-fit">
            <Checkbox checked={recurring} onCheckedChange={(v) => setRecurring(v === true)} disabled={isPending} />
            Se repite todos los años (mismo mes y día) — desmarcar solo para Semana Santa o feriados puente puntuales
          </label>
        </form>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {/* Lista */}
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-6 text-center">Sin feriados configurados.</p>
        ) : (
          <div className="-mx-4 divide-y border-t">
            {sorted.map((holiday) => (
              <div key={holiday.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {holiday.recurring ? formatRecurringDate(holiday.date) : formatOneOffDate(holiday.date)}
                    </p>
                    {holiday.recurring ? (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Repeat className="h-2.5 w-2.5" />
                        Cada año
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Solo este año</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{holiday.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive shrink-0"
                  onClick={() => setToDelete(holiday)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ConfirmAction
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="¿Quitar este feriado?"
        description={
          toDelete
            ? `"${toDelete.description}" (${toDelete.recurring ? formatRecurringDate(toDelete.date) : formatOneOffDate(toDelete.date)}) dejará de contar como día no laborable en los cálculos de plazo legal.`
            : ''
        }
        confirmLabel="Quitar feriado"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </Card>
  );
}
