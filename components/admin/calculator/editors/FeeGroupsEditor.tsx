'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { FeeCodeSelector, type FeeCatalogItem } from './FeeCodeSelector';
import { InfoPopover } from '@/components/admin/shared/InfoPopover';
import { FEE_GROUPS_INFO } from '../calculator-field-info';
import type { FeeGroup, FeeSplit } from '@/modules/admin/calculator-admin.service';

interface Props {
  data: FeeGroup[];
  onChange: (data: FeeGroup[]) => void;
  readonly: boolean;
}

// ── Validación ────────────────────────────────────────────────────────────────

export function validateFeeGroups(groups: FeeGroup[]): string[] {
  const errors: string[] = [];
  const allCodes = new Set<string>();

  for (const group of groups) {
    if (!group.name?.trim()) errors.push(`Un grupo no tiene nombre`);
    if (!group.groupCode?.trim()) errors.push(`Un grupo no tiene código`);
    if (allCodes.has(group.groupCode)) errors.push(`Código "${group.groupCode}" duplicado`);
    allCodes.add(group.groupCode);

    if (group.splits.length === 0) errors.push(`"${group.name}" no tiene cargos`);

    const total = group.splits.reduce((sum, s) => sum + s.percentage, 0);
    if (total !== 100) errors.push(`"${group.name}": los porcentajes suman ${total}% (debe ser 100%)`);

    const splitCodes = new Set<string>();
    for (const split of group.splits) {
      if (!split.feeCode?.trim()) errors.push(`"${group.name}" tiene un cargo sin código`);
      if (splitCodes.has(split.feeCode)) errors.push(`"${group.name}": cargo "${split.feeCode}" duplicado`);
      splitCodes.add(split.feeCode);
      if (split.percentage < 0) errors.push(`"${group.name}": porcentaje no puede ser negativo`);
    }
  }

  return errors;
}

export function FeeGroupsEditor({ data, onChange, readonly }: Props) {
  const [catalog, setCatalog] = useState<FeeCatalogItem[]>([]);
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set([0]));
  const feeGroups = data ?? [];
  const errors = !readonly ? validateFeeGroups(feeGroups) : [];

  // Load fee catalog from backend
  useEffect(() => {
    fetch('/api/admin/fee-catalog')
      .then((r) => r.json())
      .then((items) => { if (Array.isArray(items)) setCatalog(items); })
      .catch(() => {});
  }, []);

  const toggleGroup = (idx: number) => {
    const next = new Set(openGroups);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    setOpenGroups(next);
  };

  const handleCatalogUpdate = (item: FeeCatalogItem) => {
    setCatalog((prev) => [...prev, item]);
  };

  // ── Group operations ────────────────────────────────────────────────────

  const updateGroup = (idx: number, field: keyof FeeGroup, value: any) => {
    const updated = feeGroups.map((g, i) => i === idx ? { ...g, [field]: value } : g);
    // Auto-generate groupCode from name
    if (field === 'name') {
      updated[idx] = { ...updated[idx], groupCode: `FG-${String(value).toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '')}` };
    }
    onChange(updated);
  };

  const addGroup = () => {
    onChange([...feeGroups, { groupCode: `FG-NEW-${feeGroups.length + 1}`, name: '', description: '', splits: [] }]);
    setOpenGroups(new Set([...openGroups, feeGroups.length]));
  };

  const removeGroup = (idx: number) => {
    onChange(feeGroups.filter((_, i) => i !== idx));
  };

  // ── Split operations ────────────────────────────────────────────────────

  const updateSplit = (groupIdx: number, splitIdx: number, field: keyof FeeSplit, value: any) => {
    onChange(feeGroups.map((g, gi) =>
      gi === groupIdx ? {
        ...g,
        splits: g.splits.map((s, si) => si === splitIdx ? { ...s, [field]: field === 'percentage' ? Number(value) : value } : s),
      } : g
    ));
  };

  const updateSplitMultiple = (groupIdx: number, splitIdx: number, updates: Partial<FeeSplit>) => {
    onChange(feeGroups.map((g, gi) =>
      gi === groupIdx ? {
        ...g,
        splits: g.splits.map((s, si) => si === splitIdx ? { ...s, ...updates } : s),
      } : g
    ));
  };

  const addSplit = (groupIdx: number) => {
    onChange(feeGroups.map((g, i) =>
      i === groupIdx ? { ...g, splits: [...g.splits, { feeCode: '', percentage: 0, label: '' }] } : g
    ));
  };

  const removeSplit = (groupIdx: number, splitIdx: number) => {
    onChange(feeGroups.map((g, i) =>
      i === groupIdx ? { ...g, splits: g.splits.filter((_, si) => si !== splitIdx) } : g
    ));
  };

  // ── Summaries ───────────────────────────────────────────────────────────

  const groupSummary = (group: FeeGroup) => {
    const total = group.splits.reduce((sum, s) => sum + s.percentage, 0);
    return `${group.splits.length} cargos • ${total}%`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm">Grupos de Tarifas</CardTitle>
            <InfoPopover {...FEE_GROUPS_INFO} />
          </div>
          {!readonly && (
            <Button variant="outline" size="sm" onClick={addGroup}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Grupo
            </Button>
          )}
        </div>
        {!readonly && (
          <p className="text-xs text-muted-foreground">
            Cada grupo define cómo se distribuye una tasa entre cargos individuales. Los porcentajes deben sumar 100%.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {feeGroups.map((group, gi) => {
          const isOpen = openGroups.has(gi);
          const total = group.splits.reduce((sum, s) => sum + s.percentage, 0);
          const hasError = total !== 100 || group.splits.length === 0;

          return (
            <div key={gi} className={`rounded-lg border ${hasError && !readonly ? 'border-destructive/40' : ''}`}>
              {/* Group header */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleGroup(gi)}
              >
                <div className="flex items-center gap-2">
                  {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="text-sm font-medium">{group.name || 'Sin nombre'}</span>
                  <Badge variant="outline" className="text-[9px] font-mono">{group.groupCode}</Badge>
                  {!isOpen && (
                    <span className="text-xs text-muted-foreground">{groupSummary(group)}</span>
                  )}
                  {hasError && !readonly && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                </div>
                {!readonly && feeGroups.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeGroup(gi); }} className="h-7 px-2 text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Group content */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-4 border-t">
                  {/* Metadata */}
                  {!readonly && (
                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Nombre del grupo</Label>
                        <Input
                          value={group.name}
                          onChange={(e) => updateGroup(gi, 'name', e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]/g, ''))}
                          className="h-8 text-sm"
                          placeholder="Ej: Paquete estándar"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Descripción</Label>
                        <Input
                          value={group.description}
                          onChange={(e) => updateGroup(gi, 'description', e.target.value)}
                          className="h-8 text-sm"
                          placeholder="Para clientes con score medio"
                        />
                      </div>
                    </div>
                  )}

                  {/* Splits */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Distribución de cargos</Label>
                      {!readonly && (
                        <Button variant="ghost" size="sm" onClick={() => addSplit(gi)} className="h-6 text-[11px]">
                          <Plus className="h-3 w-3 mr-0.5" /> Cargo
                        </Button>
                      )}
                    </div>

                    {group.splits.map((split, si) => {
                      const isDuplicate = group.splits.some((s, i) => i !== si && s.feeCode === split.feeCode && split.feeCode !== '');
                      return (
                      <div key={si} className={`flex items-center gap-2 p-2 rounded border ${isDuplicate ? 'border-destructive bg-destructive/5' : 'bg-muted/20'}`}>
                        {!readonly ? (
                          <>
                            <FeeCodeSelector
                              value={split.feeCode}
                              onChange={(code, label) => {
                                updateSplitMultiple(gi, si, { feeCode: code, label });
                              }}
                              catalog={catalog}
                              onCatalogUpdate={handleCatalogUpdate}
                            />
                            <Input
                              type="number"
                              value={split.percentage}
                              onChange={(e) => updateSplit(gi, si, 'percentage', e.target.value)}
                              className="h-6 text-[11px] w-16 font-mono text-right"
                              min={0}
                              max={100}
                            />
                            <span className="text-[11px] text-muted-foreground">%</span>
                            <Button variant="ghost" size="sm" onClick={() => removeSplit(gi, si)} className="h-5 w-5 p-0 text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            {isDuplicate && (
                              <span className="text-[10px] text-destructive whitespace-nowrap">Duplicado</span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="text-xs flex-1">{split.label || split.feeCode}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full bg-primary" style={{ width: `${split.percentage}%` }} />
                              </div>
                              <span className="text-xs font-mono font-medium w-10 text-right">{split.percentage}%</span>
                            </div>
                          </>
                        )}
                      </div>
                      );
                    })}

                    {/* Total */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs font-medium">Total</span>
                      <span className={`text-xs font-mono font-bold ${total !== 100 ? 'text-destructive' : 'text-green-600'}`}>
                        {total}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

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
      </CardContent>
    </Card>
  );
}
