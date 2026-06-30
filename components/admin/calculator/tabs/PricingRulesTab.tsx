'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Upload, X, Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { publishDraftAction, discardDraftAction, saveDraftAction } from '@/app/actions/calculator-admin.actions';
import { toast } from 'sonner';
import type { ConfigEntry, PricingRulesConfig, PricingRule, Discount } from '@/modules/admin/calculator-admin.service';

interface PricingRulesTabProps {
  config: ConfigEntry;
}

export function PricingRulesTab({ config }: PricingRulesTabProps) {
  const [publishing, setPublishing] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const activeData = (config.draft?.data ?? config.published.data) as PricingRulesConfig;
  const isDraft = config.hasPendingChanges;
  const meta = isDraft ? config.draft! : config.published;

  const [rules, setRules] = useState<PricingRule[]>(activeData.rules);

  const handlePublish = async () => {
    setPublishing(true);
    const result = await publishDraftAction('PRICING_RULES');
    if (result.ok) { toast.success('Reglas publicadas'); window.location.reload(); }
    else toast.error(result.error ?? 'Error al publicar');
    setPublishing(false);
  };

  const handleDiscard = async () => {
    setDiscarding(true);
    const result = await discardDraftAction('PRICING_RULES');
    if (result.ok) { toast.success('Borrador descartado'); window.location.reload(); }
    else toast.error(result.error ?? 'Error al descartar');
    setDiscarding(false);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    const result = await saveDraftAction('PRICING_RULES', {
      productId: activeData.productId,
      rules,
    });
    if (result.ok) {
      toast.success('Borrador guardado');
      setEditing(false);
      window.location.reload();
    } else {
      toast.error(result.error ?? 'Error al guardar');
    }
    setSaving(false);
  };

  const handleCancelEdit = () => {
    setRules(activeData.rules);
    setEditing(false);
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const updateRuleFeeValue = (ruleIdx: number, fgIdx: number, value: number) => {
    setRules((prev) => prev.map((r, ri) =>
      ri === ruleIdx ? {
        ...r,
        package: {
          ...r.package,
          feeGroups: r.package.feeGroups.map((fg, fi) => fi === fgIdx ? { ...fg, value } : fg),
        },
      } : r
    ));
  };

  const updateDiscount = (ruleIdx: number, discIdx: number, field: keyof Discount, value: any) => {
    setRules((prev) => prev.map((r, ri) =>
      ri === ruleIdx ? {
        ...r,
        package: {
          ...r.package,
          discounts: r.package.discounts.map((d, di) =>
            di === discIdx ? { ...d, [field]: field === 'value' || field === 'order' ? Number(value) : value } : d
          ),
        },
      } : r
    ));
  };

  const addDiscount = (ruleIdx: number) => {
    setRules((prev) => prev.map((r, ri) =>
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
    ));
  };

  const removeDiscount = (ruleIdx: number, discIdx: number) => {
    setRules((prev) => prev.map((r, ri) =>
      ri === ruleIdx ? {
        ...r,
        package: {
          ...r.package,
          discounts: r.package.discounts.filter((_, di) => di !== discIdx),
        },
      } : r
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Badge variant={isDraft ? 'warning' : 'success'} className="text-[10px]">
            {isDraft ? 'DRAFT' : 'PUBLISHED'}
          </Badge>
          <span>v{meta.version}</span>
          <span>•</span>
          <span>{new Date(meta.updatedAt).toLocaleString('es-PE')}</span>
        </div>

        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                <X className="h-3.5 w-3.5 mr-1" /> Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveDraft} disabled={saving}>
                <Check className="h-3.5 w-3.5 mr-1" /> {saving ? 'Guardando...' : 'Guardar borrador'}
              </Button>
            </>
          ) : (
            <>
              {isDraft && (
                <>
                  <Button variant="outline" size="sm" onClick={handleDiscard} disabled={discarding}>
                    <X className="h-3.5 w-3.5 mr-1" /> {discarding ? '...' : 'Descartar'}
                  </Button>
                  <Button size="sm" onClick={handlePublish} disabled={publishing}>
                    <Upload className="h-3.5 w-3.5 mr-1" /> {publishing ? '...' : 'Publicar'}
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Rules */}
      <div className="space-y-4">
        {rules
          .sort((a, b) => b.priority - a.priority)
          .map((rule, ruleIdx) => (
            <Card key={rule.ruleId}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    Rango: {rule.selectors.scoreRanges.join(', ')}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] font-mono">P{rule.priority}</Badge>
                    <Badge variant="secondary" className="text-[9px] font-mono">{rule.ruleId}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Fee Groups — tasa */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Tarifa:</span>
                  {rule.package.feeGroups.map((fg, fgIdx) => (
                    editing ? (
                      <div key={fg.groupCode} className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">{fg.groupCode}</Badge>
                        <Input
                          type="number"
                          value={fg.value}
                          onChange={(e) => updateRuleFeeValue(ruleIdx, fgIdx, Number(e.target.value))}
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

                {/* Discounts */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-muted-foreground">Descuentos:</p>
                    {editing && (
                      <Button variant="ghost" size="sm" onClick={() => addDiscount(ruleIdx)} className="h-5 px-1.5 text-[10px]">
                        <Plus className="h-3 w-3 mr-0.5" /> Descuento
                      </Button>
                    )}
                  </div>

                  {editing ? (
                    <div className="space-y-2">
                      {rule.package.discounts
                        .sort((a, b) => a.order - b.order)
                        .map((d, discIdx) => (
                          <div key={discIdx} className="flex items-center gap-2 border rounded p-2">
                            <Input value={d.label} onChange={(e) => updateDiscount(ruleIdx, discIdx, 'label', e.target.value)} className="h-6 text-[11px] flex-1" />
                            <NativeSelect
                              value={d.calculationType}
                              onChange={(e) => updateDiscount(ruleIdx, discIdx, 'calculationType', e.target.value)}
                              className="h-6 text-[11px] w-20"
                            >
                              <NativeSelectOption value="PERCENTAGE">%</NativeSelectOption>
                              <NativeSelectOption value="FIXED_AMOUNT">S/</NativeSelectOption>
                            </NativeSelect>
                            <Input type="number" value={d.value} onChange={(e) => updateDiscount(ruleIdx, discIdx, 'value', e.target.value)} className="h-6 text-[11px] w-14 font-mono" min={0} />
                            <Button variant="ghost" size="sm" onClick={() => removeDiscount(ruleIdx, discIdx)} className="h-5 w-5 p-0 text-destructive">
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
          ))}
      </div>
    </div>
  );
}
