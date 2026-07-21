'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import type { RuleConfig, RangeEntry, ScorecardMetadata, AvailableField } from '@/modules/admin/scoring';

interface Props {
  rule: RuleConfig;
  metadata: ScorecardMetadata;
  readonly: boolean;
  onChange: (updated: RuleConfig) => void;
  onRemove: () => void;
}

export function RuleEditor({ rule, metadata, readonly, onChange, onRemove }: Props) {
  const selectedField = metadata.availableFields.find(f => f.code === rule.inputField);

  const updateField = (field: keyof RuleConfig, value: any) => {
    onChange({ ...rule, [field]: value });
  };

  // Al cambiar el inputField, ajustar el tipo de regla según el dataType del campo
  const handleFieldChange = (fieldCode: string) => {
    const field = metadata.availableFields.find(f => f.code === fieldCode);
    let newType = rule.type;
    if (field) {
      if (field.dataType === 'BOOLEAN') newType = 'BOOLEAN';
      else if (field.dataType === 'ENUM') newType = 'ENUM_MAP';
      else newType = 'RANGES';
    }

    const updates: Partial<RuleConfig> = { inputField: fieldCode, type: newType };

    // Inicializar valores por defecto según tipo
    if (newType === 'BOOLEAN') {
      updates.ranges = null;
      updates.enumMap = null;
      updates.truePoints = rule.maxPoints;
      updates.falsePoints = 0;
    } else if (newType === 'ENUM_MAP' && field?.enumValues) {
      updates.ranges = null;
      updates.truePoints = null;
      updates.falsePoints = null;
      updates.enumMap = Object.fromEntries(field.enumValues.map(e => [e.value, 0]));
      updates.defaultPoints = 0;
    } else {
      updates.truePoints = null;
      updates.falsePoints = null;
      updates.enumMap = null;
      updates.ranges = [{ operator: 'DEFAULT', value: null, points: 0 }];
    }

    onChange({ ...rule, ...updates });
  };

  // Grupos de campos por categoría para el selector
  const fieldsByCategory = metadata.availableFields.reduce((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {} as Record<string, AvailableField[]>);

  return (
    <div className="bg-muted/30 rounded p-3 space-y-2">
      {/* Header de la regla */}
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-1">
          {/* Código */}
          <div>
            <Label className="text-xs">Código</Label>
            <Input
              value={rule.code}
              onChange={(e) => updateField('code', e.target.value.toUpperCase().replace(/\s/g, '_'))}
              disabled={readonly}
              className="h-7 text-xs"
              placeholder="EXPENSE_RATIO"
            />
          </div>
          {/* Nombre */}
          <div>
            <Label className="text-xs">Nombre</Label>
            <Input
              value={rule.name}
              onChange={(e) => updateField('name', e.target.value)}
              disabled={readonly}
              className="h-7 text-xs"
              placeholder="Ratio gastos/ingreso"
            />
          </div>
          {/* Campo a evaluar */}
          <div>
            <Label className="text-xs">Campo</Label>
            <Select value={rule.inputField} onValueChange={(v) => v && handleFieldChange(v)} disabled={readonly}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Seleccionar campo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(fieldsByCategory).map(([category, fields]) => (
                  <div key={category}>
                    <div className="px-2 py-1 text-xs font-bold text-muted-foreground uppercase">{category}</div>
                    {fields.map(f => (
                      <SelectItem key={f.code} value={f.code} className="text-xs">
                        {f.name} {f.unit ? `(${f.unit})` : ''}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Max puntos */}
          <div>
            <Label className="text-xs">Max pts</Label>
            <Input
              type="number"
              value={rule.maxPoints}
              onChange={(e) => updateField('maxPoints', Number(e.target.value))}
              disabled={readonly}
              className="h-7 text-xs"
            />
          </div>
        </div>
        {!readonly && (
          <Button variant="ghost" size="sm" onClick={onRemove} className="ml-2 text-red-500">
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Tipo de regla — varía según el dataType */}
      {selectedField && (
        <div className="text-xs text-muted-foreground">
          Tipo: <strong>{rule.type}</strong> — {selectedField.description}
        </div>
      )}

      {/* Editor específico por tipo */}
      {rule.type === 'RANGES' && (
        <RangesEditor
          ranges={rule.ranges || []}
          operators={metadata.operators}
          readonly={readonly}
          onChange={(ranges) => updateField('ranges', ranges)}
        />
      )}
      {rule.type === 'BOOLEAN' && (
        <BooleanEditor
          truePoints={rule.truePoints ?? 0}
          falsePoints={rule.falsePoints ?? 0}
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
          readonly={readonly}
          onChange={(map) => updateField('enumMap', map)}
          onChangeDefault={(v) => updateField('defaultPoints', v)}
        />
      )}
    </div>
  );
}

// ─── Sub-editores ────────────────────────────────────────────────────────────

function RangesEditor({ ranges, operators, readonly, onChange }: {
  ranges: RangeEntry[];
  operators: { code: string; symbol: string; description: string }[];
  readonly: boolean;
  onChange: (ranges: RangeEntry[]) => void;
}) {
  const addRange = () => onChange([...ranges, { operator: 'DEFAULT', value: null, points: 0 }]);
  const removeRange = (i: number) => onChange(ranges.filter((_, idx) => idx !== i));
  const updateRange = (i: number, field: keyof RangeEntry, value: any) => {
    const copy = [...ranges];
    copy[i] = { ...copy[i], [field]: value };
    onChange(copy);
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">Rangos (se evalúan en orden, el primero que matchea gana)</Label>
      {ranges.map((range, i) => (
        <div key={i} className="flex items-center gap-2">
          <Select value={range.operator} onValueChange={(v) => updateRange(i, 'operator', v)} disabled={readonly}>
            <SelectTrigger className="w-20 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operators.map(op => (
                <SelectItem key={op.code} value={op.code} className="text-xs">
                  {op.symbol} {op.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {range.operator !== 'DEFAULT' && (
            <Input
              type="number"
              step="any"
              value={range.value ?? ''}
              onChange={(e) => updateRange(i, 'value', e.target.value ? Number(e.target.value) : null)}
              disabled={readonly}
              className="w-24 h-7 text-xs"
              placeholder="Valor"
            />
          )}
          <span className="text-xs text-muted-foreground">→</span>
          <Input
            type="number"
            value={range.points}
            onChange={(e) => updateRange(i, 'points', Number(e.target.value))}
            disabled={readonly}
            className="w-16 h-7 text-xs"
            placeholder="Pts"
          />
          <span className="text-xs text-muted-foreground">pts</span>
          {!readonly && (
            <Button variant="ghost" size="sm" onClick={() => removeRange(i)} className="h-6 w-6 p-0 text-red-400">
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
      {!readonly && (
        <Button variant="ghost" size="sm" onClick={addRange} className="text-xs h-6">
          <Plus className="h-3 w-3 mr-1" /> Agregar rango
        </Button>
      )}
    </div>
  );
}

function BooleanEditor({ truePoints, falsePoints, readonly, onChangeTruePoints, onChangeFalsePoints }: {
  truePoints: number;
  falsePoints: number;
  readonly: boolean;
  onChangeTruePoints: (v: number) => void;
  onChangeFalsePoints: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1">
        <Label className="text-xs">Si TRUE →</Label>
        <Input type="number" value={truePoints} onChange={(e) => onChangeTruePoints(Number(e.target.value))} disabled={readonly} className="w-16 h-7 text-xs" />
        <span className="text-xs text-muted-foreground">pts</span>
      </div>
      <div className="flex items-center gap-1">
        <Label className="text-xs">Si FALSE →</Label>
        <Input type="number" value={falsePoints} onChange={(e) => onChangeFalsePoints(Number(e.target.value))} disabled={readonly} className="w-16 h-7 text-xs" />
        <span className="text-xs text-muted-foreground">pts</span>
      </div>
    </div>
  );
}

function EnumMapEditor({ enumMap, defaultPoints, field, readonly, onChange, onChangeDefault }: {
  enumMap: Record<string, number>;
  defaultPoints: number;
  field: AvailableField | undefined;
  readonly: boolean;
  onChange: (map: Record<string, number>) => void;
  onChangeDefault: (v: number) => void;
}) {
  const entries = Object.entries(enumMap);
  const enumLabels = field?.enumValues ? Object.fromEntries(field.enumValues.map(e => [e.value, e.label])) : {};

  const updateEntry = (key: string, points: number) => {
    onChange({ ...enumMap, [key]: points });
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">Mapeo valor → puntos</Label>
      {entries.map(([key, points]) => (
        <div key={key} className="flex items-center gap-2">
          <span className="text-xs w-40 truncate" title={key}>
            {enumLabels[key] || key}
          </span>
          <span className="text-xs text-muted-foreground">→</span>
          <Input
            type="number"
            value={points}
            onChange={(e) => updateEntry(key, Number(e.target.value))}
            disabled={readonly}
            className="w-16 h-7 text-xs"
          />
          <span className="text-xs text-muted-foreground">pts</span>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <span className="text-xs w-40 text-muted-foreground italic">Otro valor (default)</span>
        <span className="text-xs text-muted-foreground">→</span>
        <Input
          type="number"
          value={defaultPoints}
          onChange={(e) => onChangeDefault(Number(e.target.value))}
          disabled={readonly}
          className="w-16 h-7 text-xs"
        />
        <span className="text-xs text-muted-foreground">pts</span>
      </div>
    </div>
  );
}
