'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Check, X, Upload, Pencil, Plus, Trash2 } from 'lucide-react';
import { publishDraftAction, discardDraftAction, saveDraftAction } from '@/app/actions/calculator-admin.actions';
import { toast } from 'sonner';
import type { ConfigEntry, AvailabilityConfig, ScoreRange, AvailabilityGroup, AvailabilityTerm } from '@/modules/admin/calculator-admin.service';

interface AvailabilityTabProps {
  config: ConfigEntry;
}

export function AvailabilityTab({ config }: AvailabilityTabProps) {
  const [publishing, setPublishing] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const activeData = (config.draft?.data ?? config.published.data) as AvailabilityConfig;
  const isDraft = config.hasPendingChanges;
  const meta = isDraft ? config.draft! : config.published;

  // Estado editable
  const [scoreRanges, setScoreRanges] = useState<ScoreRange[]>(activeData.scoreRanges);
  const [availability, setAvailability] = useState<AvailabilityGroup[]>(activeData.availability);

  const handlePublish = async () => {
    setPublishing(true);
    const result = await publishDraftAction('AVAILABILITY');
    if (result.ok) { toast.success('Disponibilidad publicada'); window.location.reload(); }
    else toast.error(result.error ?? 'Error al publicar');
    setPublishing(false);
  };

  const handleDiscard = async () => {
    setDiscarding(true);
    const result = await discardDraftAction('AVAILABILITY');
    if (result.ok) { toast.success('Borrador descartado'); window.location.reload(); }
    else toast.error(result.error ?? 'Error al descartar');
    setDiscarding(false);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    const result = await saveDraftAction('AVAILABILITY', {
      productId: activeData.productId,
      scoreRanges,
      availability,
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
    setScoreRanges(activeData.scoreRanges);
    setAvailability(activeData.availability);
    setEditing(false);
  };

  // ── Helpers de edición ──────────────────────────────────────────────────────

  const updateRange = (idx: number, field: keyof ScoreRange, value: any) => {
    setScoreRanges((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const updateGroupAmounts = (groupIdx: number, amountsStr: string) => {
    const amounts = amountsStr.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n) && n > 0);
    setAvailability((prev) => prev.map((g, i) => i === groupIdx ? { ...g, amounts } : g));
  };

  const updateTerm = (groupIdx: number, termIdx: number, field: 'terms' | 'installments', value: string) => {
    const nums = value.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n) && n > 0);
    setAvailability((prev) => prev.map((g, gi) =>
      gi === groupIdx ? {
        ...g,
        terms: g.terms.map((t, ti) => ti === termIdx ? { ...t, [field]: nums } : t)
      } : g
    ));
  };

  const addTerm = (groupIdx: number) => {
    setAvailability((prev) => prev.map((g, i) =>
      i === groupIdx ? { ...g, terms: [...g.terms, { terms: [7], installments: [1] }] } : g
    ));
  };

  const removeTerm = (groupIdx: number, termIdx: number) => {
    setAvailability((prev) => prev.map((g, i) =>
      i === groupIdx ? { ...g, terms: g.terms.filter((_, ti) => ti !== termIdx) } : g
    ));
  };

  const addGroup = () => {
    setAvailability((prev) => [...prev, { amounts: [100], terms: [{ terms: [7], installments: [1] }] }]);
  };

  const removeGroup = (idx: number) => {
    setAvailability((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      {/* Header con estado y acciones */}
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
                <Check className="h-3.5 w-3.5 mr-1" />
                {saving ? 'Guardando...' : 'Guardar borrador'}
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

      {/* Score Ranges */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Rangos de Score Crediticio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {scoreRanges.map((range, idx) => (
              <div
                key={range.code}
                className="rounded-lg border p-3 space-y-2"
                style={{ borderLeftColor: range.color, borderLeftWidth: 4 }}
              >
                {editing ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input value={range.label} onChange={(e) => updateRange(idx, 'label', e.target.value)} className="h-7 text-xs" placeholder="Label" />
                      <Input value={range.color} onChange={(e) => updateRange(idx, 'color', e.target.value)} className="h-7 text-xs w-20 font-mono" placeholder="#color" />
                    </div>
                    <div className="flex gap-2">
                      <Input type="number" value={range.minScore} onChange={(e) => updateRange(idx, 'minScore', Number(e.target.value))} className="h-7 text-xs" placeholder="Min" />
                      <Input type="number" value={range.maxScore} onChange={(e) => updateRange(idx, 'maxScore', Number(e.target.value))} className="h-7 text-xs" placeholder="Max" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{range.label}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">{range.code}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Score: {range.minScore} – {range.maxScore}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Availability Groups */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Montos y Plazos Disponibles</CardTitle>
            {editing && (
              <Button variant="outline" size="sm" onClick={addGroup}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Grupo
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {availability.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-3">
              {groupIdx > 0 && <Separator />}

              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Grupo {groupIdx + 1}</p>
                {editing && availability.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeGroup(groupIdx)} className="h-6 px-2 text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Montos */}
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">Montos (S/)</p>
                {editing ? (
                  <Input
                    value={group.amounts.join(', ')}
                    onChange={(e) => updateGroupAmounts(groupIdx, e.target.value)}
                    className="h-8 text-xs font-mono"
                    placeholder="100, 200, 300, 500"
                  />
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {group.amounts.map((amount) => (
                      <Badge key={amount} variant="secondary" className="font-mono text-xs">
                        S/ {amount.toLocaleString()}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Plazos */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-muted-foreground">Plazos → Cuotas</p>
                  {editing && (
                    <Button variant="ghost" size="sm" onClick={() => addTerm(groupIdx)} className="h-5 px-1.5 text-[10px]">
                      <Plus className="h-3 w-3 mr-0.5" /> Plazo
                    </Button>
                  )}
                </div>

                {editing ? (
                  <div className="space-y-2">
                    {group.terms.map((term, termIdx) => (
                      <div key={termIdx} className="flex items-center gap-2">
                        <Input
                          value={term.terms.join(', ')}
                          onChange={(e) => updateTerm(groupIdx, termIdx, 'terms', e.target.value)}
                          className="h-7 text-xs font-mono flex-1"
                          placeholder="7, 15, 30"
                        />
                        <span className="text-xs text-muted-foreground">→</span>
                        <Input
                          value={term.installments.join(', ')}
                          onChange={(e) => updateTerm(groupIdx, termIdx, 'installments', e.target.value)}
                          className="h-7 text-xs font-mono flex-1"
                          placeholder="1, 2, 3"
                        />
                        {group.terms.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => removeTerm(groupIdx, termIdx)} className="h-6 px-1 text-destructive">
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-3 py-1.5 text-xs font-medium text-muted-foreground">Plazo</th>
                          <th className="text-left px-3 py-1.5 text-xs font-medium text-muted-foreground">Cuotas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.terms.map((term, termIdx) => (
                          <tr key={termIdx} className="border-t">
                            <td className="px-3 py-1.5 font-mono text-xs">{term.terms.join(', ')} días</td>
                            <td className="px-3 py-1.5">
                              <div className="flex flex-wrap gap-1">
                                {term.installments.map((inst) => (
                                  <Badge key={inst} variant="outline" className="text-[10px]">{inst}</Badge>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
