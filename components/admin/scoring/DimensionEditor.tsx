'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import type { DimensionConfig, RuleConfig, ScorecardMetadata } from '@/modules/admin/scoring';
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

  const updateField = (field: keyof DimensionConfig, value: any) => {
    onChange({ ...dimension, [field]: value });
  };

  const addRule = () => {
    const newRule: RuleConfig = {
      code: `RULE_${dimension.rules.length + 1}`,
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
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="py-2 px-4">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary transition-colors">
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="font-medium text-sm">
                {dimension.name || `Dimensión ${index + 1}`}
              </span>
              <span className="text-xs text-muted-foreground">
                ({dimension.rules.length} reglas, máx {dimension.maxPoints} pts)
              </span>
            </CollapsibleTrigger>
            {!readonly && (
              <Button variant="ghost" size="sm" onClick={onRemove} className="text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-3 space-y-3">
            {/* Campos de la dimensión */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Código</Label>
                <Input
                  value={dimension.code}
                  onChange={(e) => updateField('code', e.target.value.toUpperCase().replace(/\s/g, '_'))}
                  placeholder="CAPACIDAD_PAGO"
                  disabled={readonly}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Nombre</Label>
                <Input
                  value={dimension.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Capacidad de Pago"
                  disabled={readonly}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Max puntos (peso)</Label>
                <Input
                  type="number"
                  value={dimension.maxPoints}
                  onChange={(e) => updateField('maxPoints', Number(e.target.value))}
                  disabled={readonly}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Indicador de puntos */}
            <div className="text-xs text-muted-foreground">
              Suma de reglas: <strong className={totalRulePoints > dimension.maxPoints ? 'text-amber-600' : ''}>{totalRulePoints}</strong> / {dimension.maxPoints} (se capea al máximo)
            </div>

            {/* Reglas */}
            <div className="space-y-2 pl-2 border-l-2 border-muted">
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
              <Button variant="ghost" size="sm" onClick={addRule} className="w-full text-xs">
                <Plus className="h-3 w-3 mr-1" /> Agregar regla
              </Button>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
