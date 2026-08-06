'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Plus, Trash2, GripVertical, AlertTriangle } from 'lucide-react';
import type { DimensionConfig, RuleConfig, ScorecardMetadata } from '@/modules/admin/scoring';
import { cn, READONLY_FIELD_CLASS } from '@/lib/utils';
import { RuleEditor } from './RuleEditor';

interface Props {
  dimension: DimensionConfig;
  index: number;
  metadata: ScorecardMetadata;
  readonly: boolean;
  onChange: (updated: DimensionConfig) => void;
  onRemove: () => void;
}

export function DimensionEditor({ dimension, index, metadata, readonly, onChange, onRemove }: Props) {
  const [open, setOpen] = useState(true);

  const totalRulePoints = dimension.rules.reduce((s, r) => s + r.maxPoints, 0);
  const rulesExceedDimension = totalRulePoints > dimension.maxPoints;
  const percentage = dimension.maxPoints > 0 ? Math.round((dimension.maxPoints / 1000) * 100) : 0;

  const updateField = (field: keyof DimensionConfig, value: any) => {
    onChange({ ...dimension, [field]: value });
  };

  const addRule = () => {
    const newRule: RuleConfig = {
      code: `REGLA_${dimension.rules.length + 1}`,
      name: '',
      inputField: '',
      type: 'RANGES',
      maxPoints: 50,
      ranges: [{ operator: 'DEFAULT', value: null, points: 0 }],
      truePoints: null,
      falsePoints: null,
      enumMap: null,
      defaultPoints: 0,
    };
    onChange({ ...dimension, rules: [...dimension.rules, newRule] });
  };

  const removeRule = (ruleIndex: number) => {
    onChange({ ...dimension, rules: dimension.rules.filter((_, i) => i !== ruleIndex) });
  };

  const updateRule = (ruleIndex: number, updated: RuleConfig) => {
    const copy = [...dimension.rules];
    copy[ruleIndex] = updated;
    onChange({ ...dimension, rules: copy });
  };

  return (
    <Card className="border-l-4 border-l-primary/30">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="py-2.5 px-4">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary transition-colors flex-1 text-left">
              {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-semibold text-sm truncate">
                  {dimension.name || `Dimensión ${index + 1}`}
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {dimension.maxPoints} pts ({percentage}%) · {dimension.rules.length} regla{dimension.rules.length !== 1 ? 's' : ''}
                </span>
                {rulesExceedDimension && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 whitespace-nowrap">
                    <AlertTriangle className="h-3 w-3" /> reglas exceden el peso
                  </span>
                )}
              </div>
            </CollapsibleTrigger>
            {!readonly && (
              <Button variant="ghost" size="sm" onClick={onRemove} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-4 space-y-4">
            {/* Campos de la dimensión */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-muted/40 rounded-lg p-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Identificador</Label>
                <Input
                  value={dimension.code}
                  onChange={(e) => updateField('code', e.target.value.toUpperCase().replace(/\s/g, '_'))}
                  placeholder="CAPACIDAD_PAGO"
                  disabled={readonly}
                  className={cn('h-8 text-sm font-mono', readonly && READONLY_FIELD_CLASS)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nombre visible</Label>
                <Input
                  value={dimension.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Capacidad de Pago"
                  disabled={readonly}
                  className={cn('h-8 text-sm', readonly && READONLY_FIELD_CLASS)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Peso (puntos máximos)</Label>
                <Input
                  type="number"
                  value={dimension.maxPoints}
                  onChange={(e) => updateField('maxPoints', Number(e.target.value))}
                  disabled={readonly}
                  className={cn('h-8 text-sm', readonly && READONLY_FIELD_CLASS)}
                />
                <p className={`text-[10px] ${rulesExceedDimension ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                  Suma reglas: {totalRulePoints} pts
                  {rulesExceedDimension && ` — excede el peso por ${totalRulePoints - dimension.maxPoints} pts, no se podrán obtener`}
                </p>
              </div>
            </div>

            {/* Reglas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Reglas de puntuación
                </p>
                {!readonly && dimension.rules.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    Cada regla evalúa una variable del perfil del usuario
                  </span>
                )}
              </div>

              {dimension.rules.length === 0 && (
                <p className="text-xs text-muted-foreground italic py-2">
                  Sin reglas. Agrega reglas para definir cómo se puntúa esta dimensión.
                </p>
              )}

              {dimension.rules.map((rule, ruleIdx) => (
                <RuleEditor
                  key={`${rule.code}-${ruleIdx}`}
                  rule={rule}
                  metadata={metadata}
                  readonly={readonly}
                  onChange={(updated) => updateRule(ruleIdx, updated)}
                  onRemove={() => removeRule(ruleIdx)}
                />
              ))}
            </div>

            {/* Agregar regla */}
            {!readonly && (
              <Button variant="ghost" size="sm" onClick={addRule} className="w-full text-xs border border-dashed border-muted-foreground/30 hover:border-primary/50">
                <Plus className="h-3 w-3 mr-1" /> Agregar regla
              </Button>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
