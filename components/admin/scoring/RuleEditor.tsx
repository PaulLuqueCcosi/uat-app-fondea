'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, ChevronRight } from 'lucide-react';
import type { RuleConfig, RangeEntry, ScorecardMetadata, AvailableField } from '@/modules/admin/scoring';
import { cn, READONLY_FIELD_CLASS } from '@/lib/utils';
import { FieldSelectorModal } from './FieldSelectorModal';

interface Props {
  rule: RuleConfig;
  metadata: ScorecardMetadata;
  readonly: boolean;
  onChange: (updated: RuleConfig) => void;
  onRemove: () => void;
}

export function RuleEditor({ rule, metadata, readonly, onChange, onRemove }: Props) {
  const selectedField = metadata.availableFields.find(f => f.code === rule.inputField);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);

  const updateField = (field: keyof RuleConfig, value: any) => {
    onChange({ ...rule, [field]: value });
  };

  const handleFieldSelect = (field: AvailableField) => {
    let newType = rule.type;
    if (field.dataType === 'BOOLEAN') newType = 'BOOLEAN';
    else if (field.dataType === 'ENUM') newType = 'ENUM_MAP';
    else newType = 'RANGES';

    // code y name se resincronizan SIEMPRE con la variable elegida — si no,
    // al recambiar de variable quedan describiendo el campo anterior mientras
    // inputField/type ya apuntan al nuevo (regla "miente" sobre qué evalúa).
    const updates: Partial<RuleConfig> = {
      inputField: field.code,
      type: newType,
      name: field.name,
      code: field.code.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, ''),
    };

    if (newType === 'BOOLEAN') {
      updates.ranges = null;
      updates.enumMap = null;
      updates.truePoints = rule.maxPoints;
      updates.falsePoints = 0;
    } else if (newType === 'ENUM_MAP' && field.enumValues) {
      updates.ranges = null;
      updates.truePoints = null;
      updates.falsePoints = null;
      updates.enumMap = Object.fromEntries(field.enumValues.map(e => [e.value, 0]));
      updates.defaultPoints = 0;
    } else {
      updates.truePoints = null;
      updates.falsePoints = null;
      updates.enumMap = null;
      updates.ranges = rule.ranges || [{ operator: 'DEFAULT', value: null, points: 0 }];
    }

    onChange({ ...rule, ...updates });
  };

  return (
    <div className="bg-background border rounded-lg p-3 space-y-3 shadow-sm">
      {/* Header — nombre + variable + puntos máximos */}
      <div className="flex items-start justify-between gap-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
          <div className="space-y-0.5">
            <Label className="text-[10px] text-muted-foreground uppercase">Nombre de la regla</Label>
            <Input
              value={rule.name}
              onChange={(e) => updateField('name', e.target.value)}
              disabled={readonly}
              className={cn('h-8 text-sm', readonly && READONLY_FIELD_CLASS)}
              placeholder="Ej: Antigüedad laboral"
            />
          </div>
          <div className="space-y-0.5">
            <Label className="text-[10px] text-muted-foreground uppercase">Variable a evaluar</Label>
            <Button
              variant="outline"
              className={cn('w-full h-8 justify-between text-sm font-normal', readonly && READONLY_FIELD_CLASS)}
              onClick={() => setFieldModalOpen(true)}
              disabled={readonly}
            >
              <span className={selectedField ? 'text-foreground' : 'text-muted-foreground'}>
                {selectedField ? selectedField.name : 'Seleccionar variable...'}
              </span>
              {!readonly && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            </Button>
            <FieldSelectorModal
              open={fieldModalOpen}
              onClose={() => setFieldModalOpen(false)}
              onSelect={handleFieldSelect}
              metadata={metadata}
              currentFieldCode={rule.inputField}
            />
          </div>
          <div className="space-y-0.5">
            <Label className="text-[10px] text-muted-foreground uppercase">Puntaje máximo</Label>
            <Input
              type="number"
              value={rule.maxPoints}
              onChange={(e) => updateField('maxPoints', Number(e.target.value))}
              disabled={readonly}
              className={cn('h-8 text-sm', readonly && READONLY_FIELD_CLASS)}
            />
          </div>
        </div>
        {!readonly && (
          <Button variant="ghost" size="sm" onClick={onRemove} className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 mt-4">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Editor específico por tipo */}
      {rule.type === 'RANGES' && (
        <RangesEditor
          ranges={rule.ranges || []}
          operators={metadata.operators}
          field={selectedField}
          maxPoints={rule.maxPoints}
          readonly={readonly}
          onChange={(ranges) => updateField('ranges', ranges)}
        />
      )}
      {rule.type === 'BOOLEAN' && (
        <BooleanEditor
          truePoints={rule.truePoints ?? 0}
          falsePoints={rule.falsePoints ?? 0}
          field={selectedField}
          maxPoints={rule.maxPoints}
          readonly={readonly}
          onChangeTruePoints={(v) => updateField('truePoints', v)}
          onChangeFalsePoints={(v) => updateField('falsePoints', v)}
        />
      )}
      {rule.type === 'ENUM_MAP' && (
        <EnumMapEditor
          enumMap={rule.enumMap || {}}
          defaultPoints={rule.defaultPoints ?? 0}
          field={selectedField}
          maxPoints={rule.maxPoints}
          readonly={readonly}
          onChange={(map) => updateField('enumMap', map)}
          onChangeDefault={(v) => updateField('defaultPoints', v)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TABLA DE TRAMOS NUMÉRICOS
// ═══════════════════════════════════════════════════════════════════════════════

function RangesEditor({ ranges, operators, field, maxPoints, readonly, onChange }: {
  ranges: RangeEntry[];
  operators: { code: string; symbol: string; description: string }[];
  field: AvailableField | undefined;
  maxPoints: number;
  readonly: boolean;
  onChange: (ranges: RangeEntry[]) => void;
}) {
  const addRange = () => onChange([...ranges, { operator: 'GTE', value: 0, points: 0 }]);
  const removeRange = (i: number) => onChange(ranges.filter((_, idx) => idx !== i));
  const updateRange = (i: number, rangeField: keyof RangeEntry, value: any) => {
    const copy = [...ranges];
    copy[i] = { ...copy[i], [rangeField]: value };
    onChange(copy);
  };

  const getOperatorLabel = (code: string) => {
    switch (code) {
      case 'LT': return 'Menor que';
      case 'LTE': return 'Menor o igual a';
      case 'GT': return 'Mayor que';
      case 'GTE': return 'Mayor o igual a';
      case 'EQ': return 'Igual a';
      case 'DEFAULT': return 'Cualquier otro';
      default: return code;
    }
  };

  const getOperatorSymbol = (code: string) => {
    switch (code) {
      case 'LT': return '<';
      case 'LTE': return '≤';
      case 'GT': return '>';
      case 'GTE': return '≥';
      case 'EQ': return '=';
      case 'DEFAULT': return '∗';
      default: return code;
    }
  };

  const fieldName = field?.name || 'el valor';

  return (
    <div className="space-y-2 bg-muted/30 rounded-lg p-3">
      {/* Encabezado contextual */}
      <p className="text-xs font-medium text-muted-foreground">
        Si <strong>{fieldName}</strong> es...
      </p>

      {/* Filas de tramos */}
      <div className="space-y-1.5">
        {ranges.map((range, i) => {
          const exceedsMax = range.points > maxPoints;
          return (
            <div key={i} className="flex items-center gap-2 bg-background rounded px-2 py-1.5 border">
              {/* Condición */}
              <Select value={range.operator} onValueChange={(v) => v && updateRange(i, 'operator', v)} disabled={readonly}>
                <SelectTrigger className={cn('h-7 w-[140px] text-xs', readonly && READONLY_FIELD_CLASS)}>
                  <SelectValue>
                    {getOperatorLabel(range.operator)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {operators.map(op => (
                    <SelectItem key={op.code} value={op.code} className="text-xs">
                      <span className="font-mono mr-1.5">{op.symbol}</span> {op.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Umbral */}
              {range.operator !== 'DEFAULT' ? (
                <Input
                  type="number"
                  step="any"
                  value={range.value ?? ''}
                  onChange={(e) => updateRange(i, 'value', e.target.value ? Number(e.target.value) : null)}
                  disabled={readonly}
                  className={cn('h-7 w-24 text-xs', readonly && READONLY_FIELD_CLASS)}
                />
              ) : (
                <span className="text-xs text-muted-foreground italic w-24">—</span>
              )}

              {/* Flecha */}
              <span className="text-xs text-muted-foreground">→ asignar</span>

              {/* Puntos */}
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={range.points}
                  onChange={(e) => updateRange(i, 'points', Number(e.target.value))}
                  disabled={readonly}
                  className={cn('h-7 w-16 text-xs text-center font-medium', exceedsMax && 'border-red-300 bg-red-50', readonly && READONLY_FIELD_CLASS)}
                />
                <span className="text-[10px] text-muted-foreground">pts</span>
              </div>

              {/* Warning si excede */}
              {exceedsMax && <span className="text-[10px] text-red-500">⚠️</span>}

              {/* Eliminar */}
              {!readonly && (
                <Button variant="ghost" size="sm" onClick={() => removeRange(i)} className="h-6 w-6 p-0 text-red-400 hover:text-red-600">
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Agregar */}
      {!readonly && (
        <Button variant="ghost" size="sm" onClick={addRange} className="text-xs h-7 w-full border border-dashed border-muted-foreground/20">
          <Plus className="h-3 w-3 mr-1" /> Agregar tramo
        </Button>
      )}

      <p className="text-[10px] text-muted-foreground italic">
        Se evalúan de arriba a abajo. El primero que se cumpla asigna los puntos.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVALUACIÓN SÍ / NO
// ═══════════════════════════════════════════════════════════════════════════════

function BooleanEditor({ truePoints, falsePoints, field, maxPoints, readonly, onChangeTruePoints, onChangeFalsePoints }: {
  truePoints: number;
  falsePoints: number;
  field: AvailableField | undefined;
  maxPoints: number;
  readonly: boolean;
  onChangeTruePoints: (v: number) => void;
  onChangeFalsePoints: (v: number) => void;
}) {
  const fieldName = field?.name || 'el valor';

  return (
    <div className="space-y-2 bg-muted/30 rounded-lg p-3">
      <p className="text-xs font-medium text-muted-foreground">
        Si <strong>{fieldName}</strong>...
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2.5 border border-green-200">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-sm flex-1 font-medium">Sí cumple</span>
          <span className="text-xs text-muted-foreground">→</span>
          <Input type="number" value={truePoints} onChange={(e) => onChangeTruePoints(Number(e.target.value))} disabled={readonly}
            className={cn('w-16 h-7 text-xs text-center font-medium', truePoints > maxPoints && 'border-red-300', readonly && READONLY_FIELD_CLASS)} />
          <span className="text-[10px] text-muted-foreground">pts</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5 border">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
          <span className="text-sm flex-1 font-medium">No cumple</span>
          <span className="text-xs text-muted-foreground">→</span>
          <Input type="number" value={falsePoints} onChange={(e) => onChangeFalsePoints(Number(e.target.value))} disabled={readonly}
            className={cn('w-16 h-7 text-xs text-center font-medium', readonly && READONLY_FIELD_CLASS)} />
          <span className="text-[10px] text-muted-foreground">pts</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TABLA DE OPCIONES
// ═══════════════════════════════════════════════════════════════════════════════

function EnumMapEditor({ enumMap, defaultPoints, field, maxPoints, readonly, onChange, onChangeDefault }: {
  enumMap: Record<string, number>;
  defaultPoints: number;
  field: AvailableField | undefined;
  maxPoints: number;
  readonly: boolean;
  onChange: (map: Record<string, number>) => void;
  onChangeDefault: (v: number) => void;
}) {
  const entries = Object.entries(enumMap);
  const enumLabels = field?.enumValues ? Object.fromEntries(field.enumValues.map(e => [e.value, e.label])) : {};
  const fieldName = field?.name || 'el valor';

  const updateEntry = (key: string, points: number) => {
    onChange({ ...enumMap, [key]: points });
  };

  return (
    <div className="space-y-2 bg-muted/30 rounded-lg p-3">
      <p className="text-xs font-medium text-muted-foreground">
        Según <strong>{fieldName}</strong>, asignar:
      </p>

      <div className="space-y-1">
        {entries.map(([key, points]) => {
          const exceedsMax = points > maxPoints;
          return (
            <div key={key} className="flex items-center gap-2 bg-background rounded px-3 py-1.5 border">
              <span className="text-sm flex-1">{enumLabels[key] || key}</span>
              <span className="text-xs text-muted-foreground">→</span>
              <Input
                type="number"
                value={points}
                onChange={(e) => updateEntry(key, Number(e.target.value))}
                disabled={readonly}
                className={cn('w-16 h-7 text-xs text-center font-medium', exceedsMax && 'border-red-300 bg-red-50', readonly && READONLY_FIELD_CLASS)}
              />
              <span className="text-[10px] text-muted-foreground">pts</span>
              {exceedsMax && <span className="text-[10px] text-red-500">⚠️</span>}
            </div>
          );
        })}

        {/* Default */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-dashed mt-1 pt-2">
          <span className="text-sm flex-1 text-muted-foreground italic">Otro valor</span>
          <span className="text-xs text-muted-foreground">→</span>
          <Input
            type="number"
            value={defaultPoints}
            onChange={(e) => onChangeDefault(Number(e.target.value))}
            disabled={readonly}
            className={cn('w-16 h-7 text-xs text-center font-medium', readonly && READONLY_FIELD_CLASS)}
          />
          <span className="text-[10px] text-muted-foreground">pts</span>
        </div>
      </div>
    </div>
  );
}
