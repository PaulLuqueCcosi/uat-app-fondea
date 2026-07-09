'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Separator } from '@/components/ui/separator';
import {
  Plus, Trash2, Save, Loader2, AlertCircle, CheckCircle2, History, Eye,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {
  getActivePenaltyConfigAction,
  createPenaltyConfigAction,
  getPenaltyConfigHistoryAction,
} from '@/app/actions/admin-penalty.actions';
import type { PenaltyConfigResponse } from '@/modules/admin/admin-penalty.service';

// ── Types ─────────────────────────────────────────────────────────────────────

const COLOR_PRESETS = [
  { name: 'green', value: '#10b981', label: 'Verde' },
  { name: 'yellow', value: '#f59e0b', label: 'Amarillo' },
  { name: 'orange', value: '#f97316', label: 'Naranja' },
  { name: 'red', value: '#ef4444', label: 'Rojo' },
  { name: 'blue', value: '#3b82f6', label: 'Azul' },
  { name: 'purple', value: '#8b5cf6', label: 'Morado' },
  { name: 'gray', value: '#6b7280', label: 'Gris' },
  { name: 'teal', value: '#14b8a6', label: 'Turquesa' },
];

const ICON_OPTIONS = [
  { value: 'check-circle', label: 'Check' },
  { value: 'alert-triangle', label: 'Alerta' },
  { value: 'shield-alert', label: 'Escudo' },
  { value: 'ban', label: 'Prohibido' },
  { value: 'clock', label: 'Reloj' },
  { value: 'calendar-x', label: 'Calendario' },
  { value: 'trending-up', label: 'Subida' },
  { value: 'flame', label: 'Fuego' },
  { value: 'zap', label: 'Rayo' },
  { value: 'circle-alert', label: 'Círculo' },
  { value: 'skull', label: 'Peligro' },
  { value: 'coins', label: 'Monedas' },
  { value: 'piggy-bank', label: 'Alcancía' },
  { value: 'thumbs-up', label: 'Pulgar' },
  { value: 'star', label: 'Estrella' },
  { value: 'trophy', label: 'Trofeo' },
];

interface RangeDraft {
  fromDay: number;
  toDay: number | null;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  base: 'INSTALLMENT' | 'PRINCIPAL' | null;
  color: string;
  icon: string;
  label: string;
}

interface ValidationError {
  index: number;
  field: string;
  message: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convierte nombre kebab-case (ej: "alert-triangle") al componente Lucide. */
function getLucideIcon(name: string): React.ComponentType<{ className?: string }> | null {
  // Lucide exporta con PascalCase: "alert-triangle" → "AlertTriangle"
  const pascalCase = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return (LucideIcons as any)[pascalCase] ?? null;
}

function formatRangeLabel(from: number, to: number | null): string {
  if (to === null) return `Día ${from} en adelante`;
  if (from === to) return `Día ${from}`;
  return `Día ${from} al ${to}`;
}

function formatValue(range: { type: string; value: number; base: string | null }): string {
  if (range.type === 'FIXED') return `S/ ${range.value} por día`;
  const baseLabel = range.base === 'PRINCIPAL' ? 'del monto prestado' : 'de la cuota';
  return `${range.value}% ${baseLabel} por día`;
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateRanges(ranges: RangeDraft[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];

    // fromDay debe ser >= 1
    if (range.fromDay < 1) {
      errors.push({ index: i, field: 'fromDay', message: 'Debe ser al menos 1' });
    }

    // toDay debe ser >= fromDay (si no es null)
    if (range.toDay !== null && range.toDay < range.fromDay) {
      errors.push({ index: i, field: 'toDay', message: 'Debe ser mayor o igual al día inicial' });
    }

    // value debe ser > 0
    if (range.value <= 0) {
      errors.push({ index: i, field: 'value', message: 'Debe ser mayor a 0' });
    }

    // Si es PERCENTAGE, necesita base
    if (range.type === 'PERCENTAGE' && !range.base) {
      errors.push({ index: i, field: 'base', message: 'Selecciona la base del porcentaje' });
    }

    // Verificar solapamiento con otros rangos
    for (let j = 0; j < ranges.length; j++) {
      if (i === j) continue;
      const other = ranges[j];
      if (rangesOverlap(range, other)) {
        errors.push({ index: i, field: 'fromDay', message: `Se solapa con el rango ${j + 1}` });
        break; // Solo reportar una vez por rango
      }
    }
  }

  // Verificar que el primer rango empiece en 1
  if (ranges.length > 0) {
    const sorted = [...ranges].sort((a, b) => a.fromDay - b.fromDay);
    if (sorted[0].fromDay !== 1) {
      errors.push({ index: ranges.indexOf(sorted[0]), field: 'fromDay', message: 'El primer rango debe empezar en día 1' });
    }

    // Verificar gaps (huecos entre rangos)
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      if (current.toDay !== null && next.fromDay > current.toDay + 1) {
        const gapStart = current.toDay + 1;
        const gapEnd = next.fromDay - 1;
        errors.push({
          index: ranges.indexOf(next),
          field: 'fromDay',
          message: `Hay un hueco sin cubrir: días ${gapStart}–${gapEnd}`,
        });
      }
    }

    // El último rango debería tener toDay = null (cubrir hasta el infinito)
    const lastSorted = sorted[sorted.length - 1];
    if (lastSorted.toDay !== null) {
      errors.push({
        index: ranges.indexOf(lastSorted),
        field: 'toDay',
        message: 'El último rango debe dejar "Hasta" vacío para cubrir todos los días restantes',
      });
    }
  }

  return errors;
}

function rangesOverlap(a: RangeDraft, b: RangeDraft): boolean {
  const aEnd = a.toDay ?? Infinity;
  const bEnd = b.toDay ?? Infinity;
  return a.fromDay <= bEnd && b.fromDay <= aEnd;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function PenaltyConfigPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [config, setConfig] = useState<PenaltyConfigResponse | null>(null);
  const [history, setHistory] = useState<PenaltyConfigResponse[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<RangeDraft[]>([]);
  const [configName, setConfigName] = useState('');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadConfig(); }, []);

  async function loadConfig() {
    setLoading(true);
    const [active, hist] = await Promise.all([
      getActivePenaltyConfigAction(),
      getPenaltyConfigHistoryAction(),
    ]);
    setConfig(active);
    setHistory(hist);
    setLoading(false);
  }

  function startEditing() {
    if (config && config.ranges.length > 0) {
      setDraft(config.ranges.map(r => ({
        fromDay: r.fromDay,
        toDay: r.toDay,
        type: r.type,
        value: r.value,
        base: r.base,
        color: r.color ?? '#f59e0b',
        icon: r.icon ?? 'clock',
        label: r.label ?? '',
      })));
    } else {
      setDraft([
        { fromDay: 1, toDay: 3, type: 'FIXED', value: 5, base: null, color: '#f59e0b', icon: 'clock', label: 'Mora leve' },
        { fromDay: 4, toDay: 10, type: 'FIXED', value: 7, base: null, color: '#f97316', icon: 'alert-triangle', label: 'Mora moderada' },
        { fromDay: 11, toDay: null, type: 'PERCENTAGE', value: 0.5, base: 'INSTALLMENT', color: '#ef4444', icon: 'flame', label: 'Mora grave' },
      ]);
    }
    setConfigName('');
    setErrors([]);
    setMessage(null);
    setIsEditing(true);
  }

  function addRange() {
    const lastRange = draft[draft.length - 1];
    // Auto-calcular el siguiente fromDay
    let newFrom = 1;
    if (lastRange) {
      if (lastRange.toDay !== null) {
        newFrom = lastRange.toDay + 1;
      } else {
        // Si el último es abierto, convertirlo a cerrado primero
        const updated = [...draft];
        updated[updated.length - 1] = { ...lastRange, toDay: lastRange.fromDay + 9 };
        newFrom = lastRange.fromDay + 10;
        setDraft([...updated, { fromDay: newFrom, toDay: null, type: 'FIXED', value: 5, base: null, color: '#ef4444', icon: 'alert-triangle', label: '' }]);
        return;
      }
    }
    setDraft([...draft, { fromDay: newFrom, toDay: null, type: 'FIXED', value: 5, base: null, color: '#ef4444', icon: 'alert-triangle', label: '' }]);
  }

  function removeRange(index: number) {
    setDraft(draft.filter((_, i) => i !== index));
    setErrors([]);
  }

  function updateRange(index: number, field: keyof RangeDraft, value: any) {
    const updated = [...draft];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'type' && value === 'FIXED') {
      updated[index].base = null;
    }
    if (field === 'type' && value === 'PERCENTAGE' && !updated[index].base) {
      updated[index].base = 'INSTALLMENT';
    }
    setDraft(updated);
    // Limpiar errores del campo editado
    setErrors(errors.filter(e => !(e.index === index && e.field === field)));
  }

  function getFieldError(index: number, field: string): string | undefined {
    return errors.find(e => e.index === index && e.field === field)?.message;
  }

  async function handleSave() {
    const validationErrors = validateRanges(draft);
    setErrors(validationErrors);
    if (validationErrors.length > 0) {
      setMessage({ type: 'error', text: `Hay ${validationErrors.length} error(es) de validación` });
      return;
    }

    const name = configName.trim() || `Config Mora — ${new Date().toLocaleDateString('es-PE')}`;

    startTransition(async () => {
      const result = await createPenaltyConfigAction({
        name,
        ranges: draft.map(r => ({
          fromDay: r.fromDay,
          toDay: r.toDay,
          type: r.type,
          value: r.value,
          base: r.type === 'PERCENTAGE' ? r.base : null,
          color: r.color || null,
          icon: r.icon || null,
          label: r.label || null,
        })),
      });

      if (result.ok) {
        setMessage({ type: 'success', text: 'Configuración guardada y activada' });
        setIsEditing(false);
        await loadConfig();
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.error ?? 'Error al guardar' });
      }
    });
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Editing Mode ────────────────────────────────────────────────────────────

  if (isEditing) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Nueva configuración de mora</CardTitle>
                <CardDescription>
                  Define rangos consecutivos. El último rango debe dejar "Hasta" vacío para cubrir todos los días restantes.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setErrors([]); setMessage(null); }}>
                Cancelar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nombre */}
            <div className="space-y-1.5 max-w-md">
              <Label className="text-sm font-medium">Nombre de la configuración</Label>
              <Input
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                placeholder={`Config Mora — ${new Date().toLocaleDateString('es-PE')}`}
                className="h-9"
              />
              <p className="text-[10px] text-muted-foreground">Identificador para el historial. Opcional.</p>
            </div>

            <Separator />

            {/* Rangos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Rangos de penalidad</Label>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8" onClick={addRange}>
                  <Plus className="h-3.5 w-3.5" /> Agregar rango
                </Button>
              </div>

              {draft.map((range, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${
                    errors.some(e => e.index === i) ? 'border-destructive/50 bg-destructive/5' : 'bg-muted/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-primary">Rango {i + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => removeRange(i)}
                      disabled={draft.length <= 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                    {/* Desde */}
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Desde día</Label>
                      <Input
                        type="number"
                        min={1}
                        value={range.fromDay}
                        onChange={(e) => updateRange(i, 'fromDay', Math.max(1, Number(e.target.value)))}
                        className={`h-9 font-mono ${getFieldError(i, 'fromDay') ? 'border-destructive' : ''}`}
                      />
                      {getFieldError(i, 'fromDay') && (
                        <p className="text-[10px] text-destructive">{getFieldError(i, 'fromDay')}</p>
                      )}
                    </div>

                    {/* Hasta */}
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Hasta día</Label>
                      <Input
                        type="number"
                        min={range.fromDay}
                        value={range.toDay ?? ''}
                        onChange={(e) => updateRange(i, 'toDay', e.target.value ? Math.max(range.fromDay, Number(e.target.value)) : null)}
                        placeholder="∞"
                        className={`h-9 font-mono ${getFieldError(i, 'toDay') ? 'border-destructive' : ''}`}
                      />
                      {getFieldError(i, 'toDay') && (
                        <p className="text-[10px] text-destructive leading-tight">{getFieldError(i, 'toDay')}</p>
                      )}
                    </div>

                    {/* Tipo */}
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Tipo de cargo</Label>
                      <NativeSelect
                        value={range.type}
                        onChange={(e) => updateRange(i, 'type', e.target.value)}
                        className="h-9"
                      >
                        <NativeSelectOption value="FIXED">Monto fijo (S/)</NativeSelectOption>
                        <NativeSelectOption value="PERCENTAGE">Porcentaje (%)</NativeSelectOption>
                      </NativeSelect>
                    </div>

                    {/* Valor */}
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">
                        {range.type === 'FIXED' ? 'S/ por día' : '% por día'}
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step={range.type === 'PERCENTAGE' ? 0.01 : 0.5}
                        value={range.value}
                        onChange={(e) => updateRange(i, 'value', Number(e.target.value))}
                        className={`h-9 font-mono ${getFieldError(i, 'value') ? 'border-destructive' : ''}`}
                      />
                      {getFieldError(i, 'value') && (
                        <p className="text-[10px] text-destructive">{getFieldError(i, 'value')}</p>
                      )}
                    </div>

                    {/* Base (solo si PERCENTAGE) */}
                    {range.type === 'PERCENTAGE' && (
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Calcular sobre</Label>
                        <NativeSelect
                          value={range.base ?? 'INSTALLMENT'}
                          onChange={(e) => updateRange(i, 'base', e.target.value)}
                          className="h-9"
                        >
                          <NativeSelectOption value="INSTALLMENT">Monto de la cuota</NativeSelectOption>
                          <NativeSelectOption value="PRINCIPAL">Monto del préstamo</NativeSelectOption>
                        </NativeSelect>
                      </div>
                    )}
                  </div>

                  {/* Preview del rango */}
                  <div className="mt-3 pt-3 border-t border-dashed">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {/* Label */}
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Etiqueta (para el usuario)</Label>
                        <Input
                          value={range.label}
                          onChange={(e) => updateRange(i, 'label', e.target.value)}
                          placeholder="Ej: Mora leve"
                          className="h-8 text-sm"
                        />
                      </div>

                      {/* Color */}
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Color</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={range.color.startsWith('#') ? range.color : COLOR_PRESETS.find(c => c.name === range.color)?.value ?? '#f59e0b'}
                            onChange={(e) => updateRange(i, 'color', e.target.value)}
                            className="h-8 w-10 p-0.5 cursor-pointer border rounded"
                          />
                          <div className="flex gap-1">
                            {COLOR_PRESETS.map((preset) => (
                              <button
                                key={preset.name}
                                type="button"
                                title={preset.label}
                                onClick={() => updateRange(i, 'color', preset.value)}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${
                                  range.color === preset.value ? 'border-foreground scale-110' : 'border-transparent hover:border-muted-foreground/50'
                                }`}
                                style={{ backgroundColor: preset.value }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Icono */}
                      <div className="space-y-1 col-span-2 sm:col-span-3">
                        <Label className="text-[10px] text-muted-foreground">Icono</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {ICON_OPTIONS.map((opt) => {
                            const IconComp = getLucideIcon(opt.value);
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                title={opt.label}
                                onClick={() => updateRange(i, 'icon', opt.value)}
                                className={`w-8 h-8 rounded-md border flex items-center justify-center transition-all ${
                                  range.icon === opt.value
                                    ? 'border-primary bg-primary/10 text-primary scale-110'
                                    : 'border-muted hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                {IconComp && <IconComp className="w-4 h-4" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      <span className="font-medium text-foreground">{formatRangeLabel(range.fromDay, range.toDay)}</span>
                      {' → '}
                      <span className="font-medium">{formatValue(range)}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Errores globales */}
            {errors.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Corrige los errores antes de guardar</p>
                  <ul className="mt-1 space-y-0.5">
                    {errors.slice(0, 5).map((e, i) => (
                      <li key={i} className="text-xs text-destructive/80">
                        Rango {e.index + 1} ({e.field}): {e.message}
                      </li>
                    ))}
                    {errors.length > 5 && (
                      <li className="text-xs text-destructive/80">...y {errors.length - 5} más</li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* Feedback success */}
            {message?.type === 'success' && (
              <div className="rounded-lg border border-success-200 bg-success-50 p-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success-600" />
                <p className="text-sm text-success-700">{message.text}</p>
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Al guardar, esta config se activa inmediatamente. Los créditos existentes no se ven afectados.
              </p>
              <Button className="gap-1.5" onClick={handleSave} disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar y activar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Read Mode ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Config activa */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Configuración activa</CardTitle>
              <CardDescription>
                {config ? config.name : 'No hay configuración activa'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="gap-1.5" onClick={startEditing}>
                <Save className="h-3.5 w-3.5" />
                {config ? 'Nueva configuración' : 'Crear configuración'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {config && config.ranges.length > 0 ? (
            <div className="space-y-0">
              {config.ranges.map((range, i) => (
                <div key={range.id} className="flex items-center gap-3 py-3 border-b last:border-0">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-sm font-medium text-foreground">
                      {formatRangeLabel(range.fromDay, range.toDay)} — {formatValue(range)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {range.label && <span>Label: <span className="font-medium text-foreground">{range.label}</span></span>}
                      {range.color && (
                        <span className="flex items-center gap-1">
                          Color: <span className="inline-block w-3 h-3 rounded-full border" style={{ backgroundColor: range.color }} />
                        </span>
                      )}
                      {range.icon && (() => {
                        const IconComp = getLucideIcon(range.icon);
                        return IconComp ? (
                          <span className="flex items-center gap-1">
                            Icono: <IconComp className="w-3.5 h-3.5" />
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs shrink-0">
                    {range.type === 'FIXED' ? `S/ ${range.value}` : `${range.value}%`}
                  </Badge>
                </div>
              ))}
              <div className="pt-3 mt-1">
                <p className="text-[10px] text-muted-foreground">
                  Creada: {new Date(config.createdAt).toLocaleString('es-PE')} · Por: {config.createdBy}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                No hay configuración de mora activa. Los créditos nuevos no tendrán penalidad hasta que configures una.
              </p>
              <Button size="sm" onClick={startEditing} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Crear primera configuración
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial */}
      {history.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Historial de configuraciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.map((h) => (
              <HistoryItem key={h.id} item={h} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── History Item with expandable detail ───────────────────────────────────────

function HistoryItem({ item }: { item: PenaltyConfigResponse }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b last:border-0 py-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{item.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {new Date(item.createdAt).toLocaleString('es-PE')} · {item.ranges.length} rangos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={item.isActive ? 'success' : 'secondary'} className="text-[10px]">
            {item.isActive ? 'Activa' : 'Inactiva'}
          </Badge>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setExpanded(!expanded)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 pl-2 border-l-2 border-muted space-y-1.5">
          {item.ranges.map((range) => (
            <div key={range.id} className="flex items-center justify-between text-xs py-1">
              <span className="text-muted-foreground">{formatRangeLabel(range.fromDay, range.toDay)}</span>
              <span className="font-mono font-medium">{formatValue(range)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


