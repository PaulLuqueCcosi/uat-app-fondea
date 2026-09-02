'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DiscountCodeSelector, type DiscountCatalogItem } from './DiscountCodeSelector';
import { Plus, Trash2, X, ChevronDown, ChevronRight, AlertCircle, Info } from 'lucide-react';
import type { PricingRulesConfig, PricingRule, Discount } from '@/modules/admin/calculator-admin.service';

// ── Context types (loaded from active availability + fee_groups) ───────────

interface AvailabilityContext {
  scoreRanges: { code: string; label: string; color: string }[];
  amounts: number[];
  terms: number[];
  installments: number[];
}

interface FeeGroupOption {
  groupCode: string;
  name: string;
  description: string;
}

interface Props {
  data: PricingRulesConfig;
  onChange: (data: PricingRulesConfig) => void;
  readonly: boolean;
}

// ── Validation ────────────────────────────────────────────────────────────────

export function validatePricingRules(rules: PricingRule[]): string[] {
  const errors: string[] = [];
  if (rules.length === 0) {
    errors.push('Debe haber al menos una regla');
    return errors;
  }

  // Must have exactly one default rule
  const defaultRules = rules.filter((r) => r.isDefault);
  if (defaultRules.length === 0) {
    errors.push('Debe existir una regla marcada como DEFAULT');
  } else if (defaultRules.length > 1) {
    errors.push('Solo puede haber una regla DEFAULT');
  }

  // Conditions coverage: must cover both isFirstLoan true and false
  const coversFirst = rules.some(
    (r) => (r.conditions as any).isFirstLoan === undefined || (r.conditions as any).isFirstLoan === true
  );
  const coversRecurrent = rules.some(
    (r) => (r.conditions as any).isFirstLoan === undefined || (r.conditions as any).isFirstLoan === false
  );
  if (!coversFirst) {
    errors.push('Ninguna regla cubre clientes de primer préstamo (isFirstLoan=true)');
  }
  if (!coversRecurrent) {
    errors.push('Ninguna regla cubre clientes recurrentes (isFirstLoan=false)');
  }

  const ids = new Set<string>();
  for (const rule of rules) {
    if (!rule.ruleId?.trim()) errors.push('Una regla no tiene ID');
    if (ids.has(rule.ruleId)) errors.push(`ID "${rule.ruleId}" duplicado`);
    ids.add(rule.ruleId);
    if (!rule.name?.trim()) errors.push(`Regla "${rule.ruleId}": debe tener un nombre`);
    if (rule.package.feeGroups.length === 0) {
      errors.push(`Regla "${rule.name || rule.ruleId}": debe tener al menos un grupo de tarifas`);
    }
    for (const fg of rule.package.feeGroups) {
      if (!fg.groupCode) errors.push(`Regla "${rule.ruleId}": grupo sin código`);
      if (fg.value <= 0) errors.push(`Regla "${rule.ruleId}": grupo "${fg.groupCode}" sin valor`);
    }
    for (const d of rule.package.discounts ?? []) {
      if (!d.label?.trim()) errors.push(`Regla "${rule.ruleId}": un descuento no tiene nombre`);
    }
  }
  return errors;
}

// ── Multi-select chip component ───────────────────────────────────────────────

function ChipSelector({ label, options, selected, onChange, readonly }: {
  label: string;
  options: { value: string; label: string; color?: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  readonly: boolean;
}) {
  const toggle = (value: string) => {
    if (readonly) return;
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <div className="space-y-1">
      <p className="text-[10px] text-muted-foreground">{label} {selected.length === 0 && '(todos — wildcard)'}</p>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              disabled={readonly}
              className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                isSelected
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-muted/30 border-transparent text-muted-foreground hover:border-muted-foreground/30'
              } ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Editor ───────────────────────────────────────────────────────────────

export function PricingRulesEditor({ data, onChange, readonly }: Props) {
  const rules = data.rules ?? [];
  const [availCtx, setAvailCtx] = useState<AvailabilityContext | null>(null);
  const [feeGroupOptions, setFeeGroupOptions] = useState<FeeGroupOption[]>([]);
  const [discountCatalog, setDiscountCatalog] = useState<DiscountCatalogItem[]>([]);
  const [openRules, setOpenRules] = useState<Set<number>>(new Set([0]));
  const errors = !readonly ? validatePricingRules(rules) : [];

  // Load availability context (score ranges, amounts, terms, installments)
  useEffect(() => {
    fetch('/api/admin/calculator-options')
      .then((r) => r.json())
      .then((d) => {
        if (d.scoreRanges && d.amounts) {
          const amounts = new Set<number>();
          const terms = new Set<number>();
          const installments = new Set<number>();
          for (const a of d.amounts) {
            amounts.add(a.value);
            for (const t of a.terms ?? []) {
              terms.add(t.value);
              for (const i of t.installments ?? []) {
                installments.add(i.value);
              }
            }
          }
          setAvailCtx({
            scoreRanges: d.scoreRanges,
            amounts: [...amounts].sort((a, b) => a - b),
            terms: [...terms].sort((a, b) => a - b),
            installments: [...installments].sort((a, b) => a - b),
          });
        }
      })
      .catch(() => {});
  }, []);

  // Load fee groups from active version
  useEffect(() => {
    fetch('/api/admin/fee-groups-active')
      .then((r) => r.json())
      .then((groups) => {
        if (Array.isArray(groups)) {
          setFeeGroupOptions(groups.map((g: any) => ({
            groupCode: g.groupCode,
            name: g.name,
            description: g.description ?? '',
          })));
        }
      })
      .catch(() => {});
  }, []);

  // Load discount catalog
  useEffect(() => {
    fetch('/api/admin/discount-catalog')
      .then((r) => r.json())
      .then((items) => { if (Array.isArray(items)) setDiscountCatalog(items); })
      .catch(() => {});
  }, []);

  const toggleRule = (idx: number) => {
    const next = new Set(openRules);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    setOpenRules(next);
  };

  const updateRules = (updatedRules: PricingRule[]) => {
    onChange({ ...data, rules: updatedRules });
  };

  // ── Rule operations ─────────────────────────────────────────────────────

  const addRule = () => {
    const newRule: PricingRule = {
      ruleId: `RULE-${Date.now().toString(36).toUpperCase()}`,
      name: '',
      priority: rules.length > 0 ? Math.max(...rules.map((r) => r.priority)) + 10 : 100,
      selectors: { amounts: [], terms: [], installments: [], scoreRanges: [] },
      conditions: {},
      package: { feeGroups: [], discounts: [] },
    };
    updateRules([...rules, newRule]);
    setOpenRules(new Set([...openRules, rules.length]));
  };

  const toggleDefault = (idx: number) => {
    updateRules(rules.map((r, i) => ({
      ...r,
      isDefault: i === idx ? true : false,
    })));
  };

  const removeRule = (idx: number) => {
    updateRules(rules.filter((_, i) => i !== idx));
  };

  const updateRuleField = (idx: number, field: keyof PricingRule, value: any) => {
    updateRules(rules.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  // ── Selector operations ─────────────────────────────────────────────────

  const updateSelector = (ruleIdx: number, field: string, values: string[] | number[]) => {
    updateRules(rules.map((r, i) =>
      i === ruleIdx ? { ...r, selectors: { ...r.selectors, [field]: values } } : r
    ));
  };

  // ── Fee Group operations ────────────────────────────────────────────────

  const addFeeGroup = (ruleIdx: number, groupCode: string) => {
    updateRules(rules.map((r, i) =>
      i === ruleIdx ? {
        ...r,
        package: {
          ...r.package,
          feeGroups: [...r.package.feeGroups, { groupCode, calculationType: 'PERCENTAGE', value: 20 }],
        },
      } : r
    ));
  };

  const removeFeeGroup = (ruleIdx: number, fgIdx: number) => {
    updateRules(rules.map((r, i) =>
      i === ruleIdx ? {
        ...r,
        package: { ...r.package, feeGroups: r.package.feeGroups.filter((_, fi) => fi !== fgIdx) },
      } : r
    ));
  };

  const updateFeeGroupValue = (ruleIdx: number, fgIdx: number, value: number) => {
    updateRules(rules.map((r, i) =>
      i === ruleIdx ? {
        ...r,
        package: {
          ...r.package,
          feeGroups: r.package.feeGroups.map((fg, fi) => fi === fgIdx ? { ...fg, value } : fg),
        },
      } : r
    ));
  };

  // ── Discount operations ─────────────────────────────────────────────────

  const addDiscount = (ruleIdx: number) => {
    updateRules(rules.map((r, i) =>
      i === ruleIdx ? {
        ...r,
        package: {
          ...r.package,
          discounts: [...r.package.discounts, {
            code: `DESC-${r.package.discounts.length + 1}`,
            label: '',
            calculationType: 'PERCENTAGE' as const,
            value: 5,
            appliesTo: 'FEES',
            order: r.package.discounts.length + 1,
          }],
        },
      } : r
    ));
  };

  const updateDiscount = (ruleIdx: number, dIdx: number, field: keyof Discount, value: any) => {
    updateRules(rules.map((r, i) =>
      i === ruleIdx ? {
        ...r,
        package: {
          ...r.package,
          discounts: r.package.discounts.map((d, di) =>
            di === dIdx ? { ...d, [field]: field === 'value' || field === 'order' ? Number(value) : value } : d
          ),
        },
      } : r
    ));
  };

  const updateDiscountCondition = (ruleIdx: number, dIdx: number, isFirstLoan: boolean | undefined) => {
    updateRules(rules.map((r, i) =>
      i === ruleIdx ? {
        ...r,
        package: {
          ...r.package,
          discounts: r.package.discounts.map((d, di) =>
            di === dIdx ? { ...d, conditions: isFirstLoan === undefined ? undefined : { isFirstLoan } } : d
          ),
        },
      } : r
    ));
  };

  const removeDiscount = (ruleIdx: number, dIdx: number) => {
    updateRules(rules.map((r, i) =>
      i === ruleIdx ? {
        ...r,
        package: { ...r.package, discounts: r.package.discounts.filter((_, di) => di !== dIdx) },
      } : r
    ));
  };

  // ── Display rules in array order (no reordering) ────────────────────────

  return (
    <div className="space-y-4">
      {/* Info banner */}
      {!readonly && !availCtx && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <Info className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700">
            Cargando opciones de disponibilidad. Si no hay una versión activa de Disponibilidad, los selectores no mostrarán opciones.
          </p>
        </div>
      )}

      {/* Header */}
      {!readonly && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Las reglas se evalúan por prioridad (mayor primero). La primera que matchee se aplica. La regla DEFAULT atrapa todo lo no cubierto.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addRule}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Agregar regla
            </Button>
          </div>
        </div>
      )}

      {/* Rules list */}
      <div className="space-y-3">
        {rules.map((rule, actualIdx) => {
          const isOpen = openRules.has(actualIdx);
          const ruleLabel = rule.name?.trim()
            ? rule.name
            : rule.isDefault
              ? 'Regla por defecto'
              : rule.selectors.scoreRanges.length > 0
                ? `Rango: ${rule.selectors.scoreRanges.join(', ')}`
                : 'Sin nombre';

          return (
            <Card key={rule.ruleId}>
              {/* Rule header — collapsible */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer"
                onClick={() => toggleRule(actualIdx)}
              >
                <div className="flex items-center gap-2">
                  {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="text-sm font-medium">{ruleLabel}</span>
                  {rule.isDefault && (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[9px]">DEFAULT</Badge>
                  )}
                  {!rule.isDefault && <Badge variant="outline" className="text-[9px] font-mono">P{rule.priority}</Badge>}
                  {!isOpen && rule.package.feeGroups.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {rule.package.feeGroups.map((fg) => `${fg.groupCode} ${fg.value}%`).join(' + ')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!readonly && (
                    <label className="flex items-center gap-1.5 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={!!rule.isDefault}
                        onCheckedChange={() => toggleDefault(actualIdx)}
                      />
                      <span className="text-[10px] text-muted-foreground select-none">Default</span>
                    </label>
                  )}
                  {!readonly && (
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeRule(actualIdx); }} className="h-7 px-2 text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Rule content */}
              {isOpen && (
                <CardContent className="space-y-4 border-t pt-4">
                  {/* Metadata: nombre + priority */}
                  {!readonly && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1 col-span-2">
                        <Label className="text-[10px] text-muted-foreground">Nombre de la regla</Label>
                        <Input
                          value={rule.name ?? ''}
                          onChange={(e) => updateRuleField(actualIdx, 'name', e.target.value)}
                          className="h-7 text-[11px]"
                          placeholder="Ej: Clientes alto riesgo"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Prioridad (mayor = primero)</Label>
                        <Input
                          type="number"
                          value={rule.priority}
                          onChange={(e) => updateRuleField(actualIdx, 'priority', Number(e.target.value))}
                          className="h-7 text-[11px] font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Condition: isFirstLoan */}
                  {!readonly && (
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Condición: Primer préstamo</Label>
                      <select
                        value={rule.conditions.isFirstLoan === true ? 'true' : rule.conditions.isFirstLoan === false ? 'false' : 'any'}
                        onChange={(e) => {
                          const v = e.target.value;
                          const conditions = v === 'any' ? {} : { isFirstLoan: v === 'true' };
                          updateRuleField(actualIdx, 'conditions', conditions);
                        }}
                        className="h-7 text-[11px] w-full rounded border border-input bg-background px-2"
                      >
                        <option value="any">Cualquiera</option>
                        <option value="true">Solo primer préstamo</option>
                        <option value="false">Solo recurrentes</option>
                      </select>
                    </div>
                  )}

                  {/* Selectors */}
                  <div className={`rounded-lg border p-3 space-y-2 ${rule.isDefault ? 'opacity-50 pointer-events-none' : ''}`}>
                    <p className="text-xs font-medium">
                      Selectores {rule.isDefault && <span className="text-muted-foreground italic">(no aplica — el default atrapa todo)</span>}
                    </p>
                    {availCtx ? (
                      <div className="grid grid-cols-2 gap-3">
                        <ChipSelector
                          label="Score Ranges"
                          options={availCtx.scoreRanges.map((r) => ({ value: r.code, label: r.label, color: r.color }))}
                          selected={rule.selectors.scoreRanges}
                          onChange={(v) => updateSelector(actualIdx, 'scoreRanges', v)}
                          readonly={readonly}
                        />
                        <ChipSelector
                          label="Montos"
                          options={availCtx.amounts.map((a) => ({ value: String(a), label: `S/${a}` }))}
                          selected={rule.selectors.amounts.map(String)}
                          onChange={(v) => updateSelector(actualIdx, 'amounts', v.map(Number))}
                          readonly={readonly}
                        />
                        <ChipSelector
                          label="Plazos (días)"
                          options={availCtx.terms.map((t) => ({ value: String(t), label: `${t}d` }))}
                          selected={rule.selectors.terms.map(String)}
                          onChange={(v) => updateSelector(actualIdx, 'terms', v.map(Number))}
                          readonly={readonly}
                        />
                        <ChipSelector
                          label="Cuotas"
                          options={availCtx.installments.map((i) => ({ value: String(i), label: `${i}` }))}
                          selected={rule.selectors.installments.map(String)}
                          onChange={(v) => updateSelector(actualIdx, 'installments', v.map(Number))}
                          readonly={readonly}
                        />
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground italic">Cargando opciones...</p>
                    )}
                  </div>

                  {/* Fee Groups */}
                  <div className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">Grupos de tarifas</p>
                      {!readonly && (
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              addFeeGroup(actualIdx, e.target.value);
                            }
                          }}
                          className="h-6 text-[10px] w-48 rounded border border-input bg-background px-1"
                        >
                          <option value="">+ Agregar grupo...</option>
                          {feeGroupOptions
                            .filter((fg) => !rule.package.feeGroups.some((existing) => existing.groupCode === fg.groupCode))
                            .map((fg) => (
                              <option key={fg.groupCode} value={fg.groupCode}>
                                {fg.name} ({fg.groupCode})
                              </option>
                            ))}
                        </select>
                      )}
                    </div>
                    {rule.package.feeGroups.length === 0 && (
                      <p className="text-[10px] text-muted-foreground italic">Sin grupos asignados</p>
                    )}
                    {rule.package.feeGroups.map((fg, fgIdx) => {
                      const groupInfo = feeGroupOptions.find((o) => o.groupCode === fg.groupCode);
                      return (
                        <div key={fg.groupCode} className="flex items-center gap-2 p-2 rounded border bg-muted/20">
                          <div className="flex-1">
                            <span className="text-xs font-medium">{groupInfo?.name ?? fg.groupCode}</span>
                            <Badge variant="outline" className="text-[8px] font-mono ml-1.5">{fg.groupCode}</Badge>
                          </div>
                          {!readonly ? (
                            <>
                              <Input
                                type="number"
                                value={fg.value}
                                onChange={(e) => updateFeeGroupValue(actualIdx, fgIdx, Number(e.target.value))}
                                className="h-6 w-16 text-[11px] font-mono text-right"
                                min={0}
                                max={100}
                              />
                              <span className="text-[11px] text-muted-foreground">%</span>
                              <Button variant="ghost" size="sm" onClick={() => removeFeeGroup(actualIdx, fgIdx)} className="h-5 w-5 p-0 text-destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <Badge className="font-mono">{fg.value}%</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Discounts */}
                  <div className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">Descuentos</p>
                      {!readonly && (
                        <Button variant="ghost" size="sm" onClick={() => addDiscount(actualIdx)} className="h-6 text-[10px]">
                          <Plus className="h-3 w-3 mr-0.5" /> Descuento
                        </Button>
                      )}
                    </div>
                    {rule.package.discounts.length === 0 && (
                      <p className="text-[10px] text-muted-foreground italic">Sin descuentos</p>
                    )}
                    {!readonly ? (
                      <div className="space-y-2">
                        {rule.package.discounts.length > 0 && (
                          <div className="flex items-center gap-2 px-2 text-[9px] text-muted-foreground">
                            <span className="flex-1">Nombre</span>
                            <span className="w-20 text-center">Tipo</span>
                            <span className="w-14 text-center">Valor</span>
                            <span className="w-10 text-center">Orden</span>
                            <span className="w-28 text-center">Aplica a</span>
                            <span className="w-5"></span>
                          </div>
                        )}
                        {rule.package.discounts
                          .sort((a, b) => a.order - b.order)
                          .map((d, dIdx) => (
                            <div key={dIdx} className="flex items-center gap-2 p-2 rounded border bg-muted/20">
                              <DiscountCodeSelector
                                value={d.code}
                                onChange={(code, label) => {
                                  const updated = rules.map((r, i) =>
                                    i === actualIdx ? {
                                      ...r,
                                      package: {
                                        ...r.package,
                                        discounts: r.package.discounts.map((disc, di) =>
                                          di === dIdx ? { ...disc, code, label } : disc
                                        ),
                                      },
                                    } : r
                                  );
                                  updateRules(updated);
                                }}
                                catalog={discountCatalog}
                                onCatalogUpdate={(item) => setDiscountCatalog((prev) => [...prev, item])}
                              />
                              <select
                                value={d.calculationType}
                                onChange={(e) => updateDiscount(actualIdx, dIdx, 'calculationType', e.target.value)}
                                className="h-6 text-[11px] w-20 rounded border border-input bg-background px-1"
                              >
                                <option value="PERCENTAGE">%</option>
                                <option value="FIXED_AMOUNT">S/</option>
                              </select>
                              <Input
                                type="number"
                                value={d.value}
                                onChange={(e) => updateDiscount(actualIdx, dIdx, 'value', e.target.value)}
                                className="h-6 text-[11px] w-14 font-mono"
                                min={0}
                                title="Valor del descuento"
                              />
                              <Input
                                type="number"
                                value={d.order}
                                onChange={(e) => updateDiscount(actualIdx, dIdx, 'order', e.target.value)}
                                className="h-6 text-[11px] w-10 font-mono"
                                min={1}
                                title="Orden de aplicación"
                              />
                              <select
                                value={d.conditions?.isFirstLoan === true ? 'true' : d.conditions?.isFirstLoan === false ? 'false' : 'any'}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  updateDiscountCondition(actualIdx, dIdx, v === 'any' ? undefined : v === 'true');
                                }}
                                title="A qué tipo de crédito aplica este descuento"
                                className="h-6 text-[10px] w-28 rounded border border-input bg-background px-1"
                              >
                                <option value="any">Cualquiera</option>
                                <option value="true">Solo 1er préstamo</option>
                                <option value="false">Solo recurrentes</option>
                              </select>
                              <Button variant="ghost" size="sm" onClick={() => removeDiscount(actualIdx, dIdx)} className="h-5 w-5 p-0 text-destructive">
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
                                <th className="text-right px-2.5 py-1.5 font-medium text-muted-foreground">Orden</th>
                                <th className="text-center px-2.5 py-1.5 font-medium text-muted-foreground">Aplica a</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rule.package.discounts.sort((a, b) => a.order - b.order).map((d) => (
                                <tr key={d.code} className="border-t">
                                  <td className="px-2.5 py-1.5">{d.label || d.code}</td>
                                  <td className="px-2.5 py-1.5 text-center">
                                    <Badge variant="outline" className="text-[9px]">{d.calculationType === 'PERCENTAGE' ? '%' : 'S/'}</Badge>
                                  </td>
                                  <td className="px-2.5 py-1.5 text-right font-mono">
                                    {d.calculationType === 'PERCENTAGE' ? `${d.value}%` : `S/ ${d.value}`}
                                  </td>
                                  <td className="px-2.5 py-1.5 text-right font-mono text-muted-foreground">{d.order}</td>
                                  <td className="px-2.5 py-1.5 text-center">
                                    <Badge variant="outline" className="text-[9px]">
                                      {d.conditions?.isFirstLoan === true
                                        ? '1er préstamo'
                                        : d.conditions?.isFirstLoan === false
                                          ? 'Recurrentes'
                                          : 'Cualquiera'}
                                    </Badge>
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
              )}
            </Card>
          );
        })}
      </div>

      {/* Global errors */}
      {errors.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            {errors.map((err, i) => (
              <p key={i} className="text-xs text-destructive">{err}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
