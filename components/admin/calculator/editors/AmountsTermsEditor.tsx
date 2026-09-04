'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Trash2, X, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { TagNumberInput } from './TagNumberInput';
import { InfoPopover } from '@/components/admin/shared/InfoPopover';
import { AVAILABILITY_GROUPS_INFO } from '../calculator-field-info';
import type { AvailabilityGroup } from '@/modules/admin/calculator-admin.service';

interface Props {
  availability: AvailabilityGroup[];
  onChange: (groups: AvailabilityGroup[]) => void;
  readonly: boolean;
}

const AMOUNT_SUGGESTIONS = [50, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000];
const TERM_SUGGESTIONS = [7, 14, 15, 21, 30, 45, 60, 90, 120, 180];
const INSTALLMENT_SUGGESTIONS = [1, 2, 3, 4, 5, 6, 9, 12];

// ── Validación ────────────────────────────────────────────────────────────────

interface ValidationError {
  groupIdx: number;
  combIdx?: number;
  message: string;
}

export function validateAvailabilityGroups(groups: AvailabilityGroup[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const allAmounts = new Set<number>();

  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi];

    // 1. Al menos 1 monto
    if (group.amounts.length === 0) {
      errors.push({ groupIdx: gi, message: 'Debe tener al menos 1 monto' });
    }

    // 2. Montos > 0
    for (const a of group.amounts) {
      if (a <= 0) errors.push({ groupIdx: gi, message: `Monto ${a} debe ser mayor a 0` });
    }

    // 3. Montos no duplicados entre grupos
    for (const a of group.amounts) {
      if (allAmounts.has(a)) {
        errors.push({ groupIdx: gi, message: `El monto S/ ${a} ya existe en otro grupo` });
      }
      allAmounts.add(a);
    }

    // 4. Al menos 1 combinación
    if (group.terms.length === 0) {
      errors.push({ groupIdx: gi, message: 'Debe tener al menos 1 combinación de plazos' });
    }

    // Validar combinaciones
    const allTermsInGroup = new Set<number>();

    for (let ci = 0; ci < group.terms.length; ci++) {
      const combo = group.terms[ci];

      // 5. Al menos 1 plazo
      if (combo.terms.length === 0) {
        errors.push({ groupIdx: gi, combIdx: ci, message: 'Debe tener al menos 1 plazo' });
      }

      // 6. Al menos 1 cuota
      if (combo.installments.length === 0) {
        errors.push({ groupIdx: gi, combIdx: ci, message: 'Debe tener al menos 1 cuota' });
      }

      // 7. Plazos > 0
      for (const t of combo.terms) {
        if (t <= 0) errors.push({ groupIdx: gi, combIdx: ci, message: `Plazo ${t} debe ser mayor a 0` });
      }

      // 8. Cuotas > 0 y enteras
      for (const i of combo.installments) {
        if (i <= 0 || !Number.isInteger(i)) {
          errors.push({ groupIdx: gi, combIdx: ci, message: `Cuota ${i} debe ser un entero positivo` });
        }
      }

      // 8b. El plazo debe alcanzar para las cuotas — el backend exige termDays >=
      // installmentCount (mínimo 1 día por cuota, ver scheduleService.ts). Sin este
      // chequeo, un admin podía configurar ej. "1 día" + "5 cuotas" — el combo pasaba
      // esta validación, pero se rompía recién cuando un cliente real lo elegía en la
      // calculadora (todas las simulaciones de ese combo fallan, sin explicación clara).
      for (const t of combo.terms) {
        for (const i of combo.installments) {
          if (t < i) {
            errors.push({
              groupIdx: gi,
              combIdx: ci,
              message: `El plazo ${t}d no alcanza para ${i} cuotas (mínimo 1 día por cuota)`,
            });
          }
        }
      }

      // 9. Plazos no repetidos entre combinaciones del mismo grupo
      for (const t of combo.terms) {
        if (allTermsInGroup.has(t)) {
          errors.push({ groupIdx: gi, combIdx: ci, message: `El plazo ${t}d ya existe en otra combinación de este grupo` });
        }
        allTermsInGroup.add(t);
      }
    }
  }

  return errors;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function AmountsTermsEditor({ availability, onChange, readonly }: Props) {
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set([0]));
  const [openCombos, setOpenCombos] = useState<Set<string>>(new Set(['0-0']));

  const errors = !readonly ? validateAvailabilityGroups(availability) : [];
  const errorsByGroup = (gi: number) => errors.filter((e) => e.groupIdx === gi && e.combIdx === undefined);
  const errorsByCombo = (gi: number, ci: number) => errors.filter((e) => e.groupIdx === gi && e.combIdx === ci);

  const toggleGroup = (idx: number) => {
    const next = new Set(openGroups);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    setOpenGroups(next);
  };

  const toggleCombo = (gi: number, ci: number) => {
    const key = `${gi}-${ci}`;
    const next = new Set(openCombos);
    next.has(key) ? next.delete(key) : next.add(key);
    setOpenCombos(next);
  };

  const updateGroup = (groupIdx: number, updated: AvailabilityGroup) => {
    onChange(availability.map((g, i) => i === groupIdx ? updated : g));
  };

  const addGroup = () => {
    onChange([...availability, { amounts: [100], terms: [{ terms: [7], installments: [1] }] }]);
    setOpenGroups(new Set([...openGroups, availability.length]));
  };

  const removeGroup = (idx: number) => {
    onChange(availability.filter((_, i) => i !== idx));
  };

  const addTermEntry = (groupIdx: number) => {
    const group = availability[groupIdx];
    updateGroup(groupIdx, { ...group, terms: [...group.terms, { terms: [7], installments: [1] }] });
    setOpenCombos(new Set([...openCombos, `${groupIdx}-${group.terms.length}`]));
  };

  const removeTermEntry = (groupIdx: number, termIdx: number) => {
    const group = availability[groupIdx];
    if (group.terms.length <= 1) return;
    updateGroup(groupIdx, { ...group, terms: group.terms.filter((_, i) => i !== termIdx) });
  };

  // ── Resúmenes ───────────────────────────────────────────────────────────

  const groupSummary = (group: AvailabilityGroup) => {
    const amountRange = group.amounts.length > 0
      ? `S/ ${group.amounts[0].toLocaleString()} – ${group.amounts[group.amounts.length - 1].toLocaleString()}`
      : 'Sin montos';
    const allTerms = group.terms.flatMap((t) => t.terms);
    const termRange = allTerms.length > 0
      ? `${Math.min(...allTerms)} – ${Math.max(...allTerms)} días`
      : 'Sin plazos';
    return `${group.amounts.length} montos (${amountRange}) • ${termRange}`;
  };

  const comboSummary = (combo: { terms: number[]; installments: number[] }) => {
    const terms = combo.terms.length > 0 ? combo.terms.map((t) => `${t}d`).join(', ') : 'Sin plazos';
    const insts = combo.installments.length > 0 ? combo.installments.join(', ') + ' cuotas' : 'Sin cuotas';
    return `${terms} → ${insts}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm">Montos y Plazos Disponibles</CardTitle>
            <InfoPopover {...AVAILABILITY_GROUPS_INFO} />
          </div>
          {!readonly && (
            <Button variant="outline" size="sm" onClick={addGroup}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Grupo
            </Button>
          )}
        </div>
        {!readonly && (
          <p className="text-xs text-muted-foreground">
            Cada grupo asocia montos con sus plazos/cuotas. Un monto solo puede pertenecer a un grupo.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {availability.map((group, gi) => {
          const isGroupOpen = openGroups.has(gi);
          const groupErrors = errorsByGroup(gi);
          const hasErrors = errors.some((e) => e.groupIdx === gi);

          return (
            <div
              key={gi}
              className={`rounded-lg border ${hasErrors ? 'border-destructive/40' : 'border-border'}`}
            >
              {/* Group header (collapsible trigger) */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleGroup(gi)}
              >
                <div className="flex items-center gap-2">
                  {isGroupOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="text-sm font-medium">Grupo {gi + 1}</span>
                  {!isGroupOpen && (
                    <span className="text-xs text-muted-foreground">{groupSummary(group)}</span>
                  )}
                  {hasErrors && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                </div>
                {!readonly && availability.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); removeGroup(gi); }}
                    className="h-7 px-2 text-destructive text-xs"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Group content */}
              {isGroupOpen && (
                <div className="px-4 pb-4 space-y-4 border-t">
                  {/* Montos */}
                  <div className="space-y-1.5 pt-3">
                    <Label className="text-xs text-muted-foreground">Montos disponibles (S/)</Label>
                    <TagNumberInput
                      values={group.amounts}
                      onChange={(amounts) => updateGroup(gi, { ...group, amounts })}
                      suggestions={AMOUNT_SUGGESTIONS}
                      formatLabel={(v) => `S/ ${v.toLocaleString()}`}
                      placeholder="Escribe un monto y presiona Enter"
                      readonly={readonly}
                    />
                  </div>

                  {/* Errores del grupo */}
                  {groupErrors.map((err, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {err.message}
                    </div>
                  ))}

                  {/* Combinaciones */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Combinaciones de plazos y cuotas</Label>
                      {!readonly && (
                        <Button variant="ghost" size="sm" onClick={() => addTermEntry(gi)} className="h-6 text-[11px]">
                          <Plus className="h-3 w-3 mr-0.5" /> Combinación
                        </Button>
                      )}
                    </div>

                    {group.terms.map((combo, ci) => {
                      const isComboOpen = openCombos.has(`${gi}-${ci}`);
                      const comboErrors = errorsByCombo(gi, ci);

                      return (
                        <div
                          key={ci}
                          className={`rounded-md border ${comboErrors.length > 0 ? 'border-destructive/40' : 'border-border/60'} bg-muted/20`}
                        >
                          {/* Combo header */}
                          <div
                            className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors"
                            onClick={() => toggleCombo(gi, ci)}
                          >
                            <div className="flex items-center gap-2">
                              {isComboOpen
                                ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                              <span className="text-xs font-medium">Comb. {ci + 1}</span>
                              {!isComboOpen && (
                                <span className="text-[11px] text-muted-foreground">{comboSummary(combo)}</span>
                              )}
                              {comboErrors.length > 0 && <AlertCircle className="h-3 w-3 text-destructive" />}
                            </div>
                            {!readonly && group.terms.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); removeTermEntry(gi, ci); }}
                                className="h-5 px-1 text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>

                          {/* Combo content */}
                          {isComboOpen && (
                            <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/40">
                              {/* Plazos */}
                              <div className="space-y-1.5">
                                <p className="text-[11px] text-muted-foreground">Plazos (días)</p>
                                <TagNumberInput
                                  values={combo.terms}
                                  onChange={(terms) => {
                                    const updatedTerms = group.terms.map((t, i) => i === ci ? { ...t, terms } : t);
                                    updateGroup(gi, { ...group, terms: updatedTerms });
                                  }}
                                  suggestions={TERM_SUGGESTIONS}
                                  formatLabel={(v) => `${v}d`}
                                  placeholder="Días y Enter"
                                  readonly={readonly}
                                />
                              </div>

                              {/* Cuotas */}
                              <div className="space-y-1.5">
                                <p className="text-[11px] text-muted-foreground">Cuotas</p>
                                <TagNumberInput
                                  values={combo.installments}
                                  onChange={(installments) => {
                                    const updatedTerms = group.terms.map((t, i) => i === ci ? { ...t, installments } : t);
                                    updateGroup(gi, { ...group, terms: updatedTerms });
                                  }}
                                  suggestions={INSTALLMENT_SUGGESTIONS}
                                  formatLabel={(v) => `${v}`}
                                  placeholder="Cuotas y Enter"
                                  readonly={readonly}
                                />
                              </div>

                              {/* Combo errors */}
                              {comboErrors.map((err, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-xs text-destructive">
                                  <AlertCircle className="h-3 w-3" />
                                  {err.message}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Errores globales */}
        {errors.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">
              Hay {errors.length} {errors.length === 1 ? 'error' : 'errores'} de validación. Corrígelos antes de guardar.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
