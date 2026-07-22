'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Plus, Trash2, X } from 'lucide-react';
import type { PricingRulesConfig, PricingRule, Discount } from '@/modules/admin/calculator-admin.service';

interface Props {
  data: PricingRulesConfig;
  onChange: (data: PricingRulesConfig) => void;
  readonly: boolean;
}

export function PricingRulesEditor({ data, onChange, readonly }: Props) {
  const rules = data.rules ?? [];

  const updateRule = (updatedRules: PricingRule[]) => {
    onChange({ ...data, rules: updatedRules });
  };

  // ── Fee Groups dentro de cada regla ─────────────────────────────────────

  const updateRuleFeeValue = (ruleIdx: number, fgIdx: number, value: number) => {
    const updated = rules.map((r, ri) =>
      ri === ruleIdx ? {
        ...r,
        package: {
          ...r.package,
          feeGroups: r.package.feeGroups.map((fg, fi) => fi === fgIdx ? { ...fg, value } : fg),
        },
      } : r
    );
    updateRule(updated);
  };

  // ── Descuentos ──────────────────────────────────────────────────────────

  const updateDiscount = (ruleIdx: number, discIdx: number, field: keyof Discount, value: any) => {
    const updated = rules.map((r, ri) =>
      ri === ruleIdx ? {
        ...r,
        package: {
          ...r.package,
          discounts: r.package.discounts.map((d, di) =>
            di === discIdx ? { ...d, [field]: field === 'value' || field === 'order' ? Number(value) : value } : d
          ),
        },
      } : r
    );
    updateRule(updated);
  };

  const addDiscount = (ruleIdx: number) => {
    const updated = rules.map((r, ri) =>
      ri === ruleIdx ? {
        ...r,
        package: {
          ...r.package,
          discounts: [...r.package.discounts, {
            code: 'NEW-DISCOUNT',
            label: 'Nuevo descuento',
            calculationType: 'PERCENTAGE' as const,
            value: 5,
            appliesTo: 'FEES',
            order: r.package.discounts.length + 1,
          }],
        },
      } : r
    );
    updateRule(updated);
  };

  const removeDiscount = (ruleIdx: number, discIdx: number) => {
    const updated = rules.map((r, ri) =>
      ri === ruleIdx ? {
        ...r,
        package: {
          ...r.package,
          discounts: r.package.discounts.filter((_, di) => di !== discIdx),
        },
      } : r
    );
    updateRule(updated);
  };

  // ── Selectores de la regla ──────────────────────────────────────────────

  const updateSelector = (ruleIdx: number, field: string, value: string) => {
    const nums = value.split(',').map((s) => s.trim()).filter(Boolean);
    const updated = rules.map((r, ri) =>
      ri === ruleIdx ? {
        ...r,
        selectors: { ...r.selectors, [field]: field === 'scoreRanges' ? nums : nums.map(Number).filter((n) => !isNaN(n)) },
      } : r
    );
    updateRule(updated);
  };

  const addRule = () => {
    const newRule: PricingRule = {
      ruleId: `RULE-${rules.length + 1}`,
      priority: Math.max(0, ...rules.map((r) => r.priority)) - 10,
      selectors: { amounts: [], terms: [], installments: [], scoreRanges: [] },
      conditions: {},
      package: { feeGroups: [], discounts: [] },
    };
    updateRule([...rules, newRule]);
  };

  const removeRule = (idx: number) => {
    updateRule(rules.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {!readonly && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={addRule}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Agregar regla
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {[...rules]
          .sort((a, b) => b.priority - a.priority)
          .map((rule, ruleIdx) => {
            // Find the actual index in the unsorted array
            const actualIdx = rules.findIndex((r) => r.ruleId === rule.ruleId);

            return (
              <Card key={rule.ruleId}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      {rule.selectors.scoreRanges.length > 0
                        ? `Rango: ${rule.selectors.scoreRanges.join(', ')}`
                        : 'Todos los rangos (wildcard)'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] font-mono">P{rule.priority}</Badge>
                      <Badge variant="secondary" className="text-[9px] font-mono">{rule.ruleId}</Badge>
                      {!readonly && (
                        <Button variant="ghost" size="sm" onClick={() => removeRule(actualIdx)} className="h-6 px-2 text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Selectores (editable) */}
                  {!readonly && (
                    <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-muted/30 border">
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">Score Ranges (vacío = todos)</p>
                        <Input
                          value={rule.selectors.scoreRanges.join(', ')}
                          onChange={(e) => updateSelector(actualIdx, 'scoreRanges', e.target.value)}
                          className="h-6 text-[11px] font-mono"
                          placeholder="BAJO, MEDIO, ALTO"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">Montos (vacío = todos)</p>
                        <Input
                          value={rule.selectors.amounts.join(', ')}
                          onChange={(e) => updateSelector(actualIdx, 'amounts', e.target.value)}
                          className="h-6 text-[11px] font-mono"
                          placeholder="100, 200, 500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Fee Groups — tasa */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">Tarifa:</span>
                    {rule.package.feeGroups.map((fg, fgIdx) => (
                      !readonly ? (
                        <div key={fg.groupCode} className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">{fg.groupCode}</Badge>
                          <Input
                            type="number"
                            value={fg.value}
                            onChange={(e) => updateRuleFeeValue(actualIdx, fgIdx, Number(e.target.value))}
                            className="h-6 w-16 text-xs font-mono"
                            min={0}
                            max={100}
                          />
                          <span className="text-xs">%</span>
                        </div>
                      ) : (
                        <Badge key={fg.groupCode} variant="default" className="text-xs">
                          {fg.groupCode} — {fg.value}%
                        </Badge>
                      )
                    ))}
                  </div>

                  {/* Descuentos */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs text-muted-foreground">Descuentos:</p>
                      {!readonly && (
                        <Button variant="ghost" size="sm" onClick={() => addDiscount(actualIdx)} className="h-5 px-1.5 text-[10px]">
                          <Plus className="h-3 w-3 mr-0.5" /> Descuento
                        </Button>
                      )}
                    </div>

                    {!readonly ? (
                      <div className="space-y-2">
                        {rule.package.discounts
                          .sort((a, b) => a.order - b.order)
                          .map((d, discIdx) => (
                            <div key={discIdx} className="flex items-center gap-2 border rounded p-2">
                              <Input value={d.label} onChange={(e) => updateDiscount(actualIdx, discIdx, 'label', e.target.value)} className="h-6 text-[11px] flex-1" />
                              <NativeSelect
                                value={d.calculationType}
                                onChange={(e) => updateDiscount(actualIdx, discIdx, 'calculationType', e.target.value)}
                                className="h-6 text-[11px] w-20"
                              >
                                <NativeSelectOption value="PERCENTAGE">%</NativeSelectOption>
                                <NativeSelectOption value="FIXED_AMOUNT">S/</NativeSelectOption>
                              </NativeSelect>
                              <Input type="number" value={d.value} onChange={(e) => updateDiscount(actualIdx, discIdx, 'value', e.target.value)} className="h-6 text-[11px] w-14 font-mono" min={0} />
                              <Button variant="ghost" size="sm" onClick={() => removeDiscount(actualIdx, discIdx)} className="h-5 w-5 p-0 text-destructive">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    ) : (
                      rule.package.discounts.length > 0 && (
                        <div className="rounded border overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="text-left px-2.5 py-1.5 font-medium text-muted-foreground">Nombre</th>
                                <th className="text-center px-2.5 py-1.5 font-medium text-muted-foreground">Tipo</th>
                                <th className="text-right px-2.5 py-1.5 font-medium text-muted-foreground">Valor</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rule.package.discounts.sort((a, b) => a.order - b.order).map((d) => (
                                <tr key={d.code} className="border-t">
                                  <td className="px-2.5 py-1.5">{d.label}</td>
                                  <td className="px-2.5 py-1.5 text-center">
                                    <Badge variant="outline" className="text-[9px]">{d.calculationType === 'PERCENTAGE' ? '%' : 'S/'}</Badge>
                                  </td>
                                  <td className="px-2.5 py-1.5 text-right font-mono font-medium">
                                    {d.calculationType === 'PERCENTAGE' ? `${d.value}%` : `S/ ${d.value}`}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
