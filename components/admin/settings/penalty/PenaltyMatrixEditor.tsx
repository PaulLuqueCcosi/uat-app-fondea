'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  MATRIX_CONCEPTS,
  conceptHelp,
  conceptLabel,
  methodLabel,
  valueUnit,
  type ChargeConcept,
  type ChargeMethod,
} from '@/modules/shared/charge-concepts';
import type { ConceptsCatalog } from '@/modules/admin/admin-penalty.types';
import { ICON_OPTIONS } from './penalty-style-options';
import {
  addStage,
  effectiveMax,
  findMethodSpec,
  normalizeAllocationOrder,
  removeStage,
  setStageToDay,
  type CellDraft,
  type MatrixDraft,
  type MatrixError,
  type StageDraft,
} from './penalty-matrix';

interface Props {
  draft: MatrixDraft;
  onChange: (draft: MatrixDraft) => void;
  catalog: ConceptsCatalog;
  errors: MatrixError[];
}

export function PenaltyMatrixEditor({ draft, onChange, catalog, errors }: Props) {
  const conceptLabelOf = (code: ChargeConcept) =>
    conceptLabel(code, catalog.concepts.find((c) => c.code === code)?.label);

  function updateStage(index: number, patch: Partial<StageDraft>) {
    onChange({ ...draft, stages: draft.stages.map((s, i) => (i === index ? { ...s, ...patch } : s)) });
  }

  function updateCell(index: number, concept: ChargeConcept, cell: CellDraft) {
    const stage = draft.stages[index];
    updateStage(index, { cells: { ...stage.cells, [concept]: cell } });
  }

  function changeMethod(index: number, concept: ChargeConcept, method: ChargeMethod | '') {
    const current = draft.stages[index].cells[concept];
    if (method === '') {
      updateCell(index, concept, { method: '', value: '' });
      return;
    }
    // Si cambia el tipo de valor (% vs. S/) el número anterior ya no tiene sentido: parte de 0.
    const sameKind =
      current !== undefined &&
      current.method !== '' &&
      current.value !== '' &&
      findMethodSpec(catalog, concept, current.method)?.valueKind === findMethodSpec(catalog, concept, method)?.valueKind;
    updateCell(index, concept, { method, value: sameKind ? current.value : '0' });
  }

  function moveConcept(from: number, to: number) {
    const current = normalizeAllocationOrder(draft.allocationOrder);
    if (to < 0 || to >= current.length) return;
    const next = [...current];
    [next[from], next[to]] = [next[to], next[from]];
    onChange({ ...draft, allocationOrder: next });
  }

  const order = normalizeAllocationOrder(draft.allocationOrder);

  return (
    <div className="space-y-6">
      {/* Matriz */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <Label className="text-sm font-medium">Tramos de mora por concepto</Label>
            <p className="text-xs text-muted-foreground">
              Cada tramo cubre un rango de días de atraso, consecutivo con el anterior. Un concepto sin regla no se cobra.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 shrink-0 gap-1.5 text-xs"
            onClick={() => onChange({ ...draft, stages: addStage(draft.stages) })}
          >
            <Plus className="h-3.5 w-3.5" /> Agregar tramo
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[920px] text-xs">
            <caption className="sr-only">Configuración de mora: una fila por tramo y una columna por concepto</caption>
            <thead className="bg-muted/40 text-left">
              <tr>
                <th scope="col" className="w-64 px-3 py-2 font-medium">Tramo</th>
                {MATRIX_CONCEPTS.map((concept) => (
                  <th key={concept} scope="col" className="px-3 py-2 font-medium" title={conceptHelp(concept)}>
                    <span className="flex items-center gap-1">
                      {conceptLabelOf(concept)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {draft.stages.map((stage, i) => {
                const isLast = i === draft.stages.length - 1;
                const stageErrors = errors.filter((e) => e.stageIndex === i);
                const stageName = stage.label.trim() || `Tramo ${i + 1}`;
                return (
                  <tr
                    key={stage.key}
                    className={`border-t align-top ${stageErrors.length > 0 ? 'bg-destructive/5' : ''}`}
                  >
                    <th scope="row" className="px-3 py-3 text-left font-normal">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            aria-label={`Etiqueta del tramo ${i + 1}`}
                            value={stage.label}
                            onChange={(e) => updateStage(i, { label: e.target.value })}
                            placeholder={`Tramo ${i + 1}`}
                            className="h-8 text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 shrink-0 p-0 text-destructive hover:text-destructive"
                            onClick={() => onChange({ ...draft, stages: removeStage(draft.stages, i) })}
                            disabled={draft.stages.length <= 1}
                            aria-label={`Quitar ${stageName}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Desde día</Label>
                            <Input
                              aria-label={`Desde día del ${stageName}`}
                              value={stage.fromDay}
                              readOnly
                              tabIndex={-1}
                              className="h-8 w-16 bg-muted/40 font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Hasta día</Label>
                            <Input
                              aria-label={`Hasta día del ${stageName}`}
                              type="number"
                              min={stage.fromDay}
                              value={stage.toDay ?? ''}
                              disabled={isLast}
                              placeholder="∞"
                              onChange={(e) =>
                                onChange({
                                  ...draft,
                                  stages: setStageToDay(
                                    draft.stages,
                                    i,
                                    e.target.value === '' ? null : Number(e.target.value),
                                  ),
                                })
                              }
                              className="h-8 w-20 font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Color</Label>
                            <Input
                              aria-label={`Color del ${stageName}`}
                              type="color"
                              value={stage.color.startsWith('#') ? stage.color : '#f59e0b'}
                              onChange={(e) => updateStage(i, { color: e.target.value })}
                              className="h-8 w-9 cursor-pointer rounded border p-0.5"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Icono</Label>
                            <NativeSelect
                              aria-label={`Icono del ${stageName}`}
                              value={stage.icon}
                              onChange={(e) => updateStage(i, { icon: e.target.value })}
                              className="w-28"
                            >
                              {ICON_OPTIONS.map((o) => (
                                <NativeSelectOption key={o.value} value={o.value}>{o.label}</NativeSelectOption>
                              ))}
                            </NativeSelect>
                          </div>
                        </div>
                        {isLast && (
                          <p className="text-[10px] text-muted-foreground">El último tramo queda abierto (sin día final).</p>
                        )}
                        {stageErrors
                          .filter((e) => e.concept === undefined)
                          .map((e, k) => (
                            <p key={k} role="alert" className="text-[11px] text-destructive">{e.message}</p>
                          ))}
                      </div>
                    </th>

                    {MATRIX_CONCEPTS.map((concept) => {
                      const spec = catalog.concepts.find((c) => c.code === concept);
                      const cell = stage.cells[concept] ?? { method: '' as const, value: '' };
                      const methodSpec = findMethodSpec(catalog, concept, cell.method);
                      const cellError = stageErrors.find((e) => e.concept === concept);
                      return (
                        <td key={concept} className="px-3 py-3">
                          {!spec || spec.allowedMethods.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground">Sin métodos disponibles.</p>
                          ) : (
                            <div className="space-y-1.5">
                              <NativeSelect
                                aria-label={`Método de ${conceptLabelOf(concept)} en ${stageName}`}
                                value={cell.method}
                                onChange={(e) => changeMethod(i, concept, e.target.value as ChargeMethod | '')}
                                className="w-full"
                              >
                                <NativeSelectOption value="">No se cobra</NativeSelectOption>
                                {spec.allowedMethods.map((m) => (
                                  <NativeSelectOption key={m.method} value={m.method}>
                                    {methodLabel(m.method)}
                                  </NativeSelectOption>
                                ))}
                              </NativeSelect>
                              {methodSpec && (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    <Input
                                      aria-label={`Valor de ${conceptLabelOf(concept)} en ${stageName}`}
                                      type="number"
                                      inputMode="decimal"
                                      min={methodSpec.min}
                                      max={effectiveMax(methodSpec, catalog)}
                                      step="0.01"
                                      value={cell.value}
                                      onChange={(e) =>
                                        updateCell(i, concept, { method: cell.method, value: e.target.value })
                                      }
                                      aria-invalid={cellError !== undefined}
                                      className={`h-8 font-mono ${cellError ? 'border-destructive' : ''}`}
                                    />
                                    <span className="shrink-0 text-muted-foreground">
                                      {valueUnit(methodSpec.valueKind)}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    De {methodSpec.min} a {effectiveMax(methodSpec, catalog)} {valueUnit(methodSpec.valueKind)}
                                  </p>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Base de cálculo: con o sin IGV */}
      <label className="flex max-w-2xl cursor-pointer items-start gap-3 rounded-lg border p-3">
        <input
          type="checkbox"
          className="mt-1"
          checked={draft.includeIgv}
          onChange={(e) => onChange({ ...draft, includeIgv: e.target.checked })}
        />
        <span>
          <span className="block text-sm font-medium">Calcular la mora sobre el monto con IGV</span>
          <span className="block text-xs text-muted-foreground">
            Apagado, la mora se calcula sobre el monto neto de cada concepto de la cuota (sin IGV). Encendido, sobre el monto
            neto más su IGV. Solo afecta a los créditos nuevos que usen esta configuración.
          </span>
        </span>
      </label>

      {/* Orden de imputación */}
      <div className="space-y-2">
        <div>
          <Label className="text-sm font-medium">Orden de imputación del pago</Label>
          <p className="text-xs text-muted-foreground">
            Cuando el cliente paga, la mora se cubre en este orden (de arriba hacia abajo), después el interés de la cuota y por último el capital.
          </p>
        </div>
        <ol className="max-w-md divide-y rounded-lg border">
          {order.map((concept, i) => (
            <li key={concept} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <span>
                <span className="mr-2 font-mono text-xs text-muted-foreground">{i + 1}.</span>
                {conceptLabelOf(concept)}
              </span>
              <span className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => moveConcept(i, i - 1)}
                  disabled={i === 0}
                  aria-label={`Subir ${conceptLabelOf(concept)} en el orden de imputación`}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => moveConcept(i, i + 1)}
                  disabled={i === order.length - 1}
                  aria-label={`Bajar ${conceptLabelOf(concept)} en el orden de imputación`}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
