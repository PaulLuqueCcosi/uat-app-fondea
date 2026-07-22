'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, X } from 'lucide-react';
import type { AvailabilityConfig, ScoreRange, AvailabilityGroup } from '@/modules/admin/calculator-admin.service';

interface Props {
  data: AvailabilityConfig;
  onChange: (data: AvailabilityConfig) => void;
  readonly: boolean;
}

export function AvailabilityEditor({ data, onChange, readonly }: Props) {
  const scoreRanges = data.scoreRanges ?? [];
  const availability = data.availability ?? [];

  // ── Score Ranges ────────────────────────────────────────────────────────

  const updateRange = (idx: number, field: keyof ScoreRange, value: any) => {
    const updated = scoreRanges.map((r, i) => i === idx ? { ...r, [field]: value } : r);
    onChange({ ...data, scoreRanges: updated });
  };

  // ── Availability Groups ─────────────────────────────────────────────────

  const updateGroupAmounts = (groupIdx: number, amountsStr: string) => {
    const amounts = amountsStr.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n) && n > 0);
    const updated = availability.map((g, i) => i === groupIdx ? { ...g, amounts } : g);
    onChange({ ...data, availability: updated });
  };

  const updateTerm = (groupIdx: number, termIdx: number, field: 'terms' | 'installments', value: string) => {
    const nums = value.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n) && n > 0);
    const updated = availability.map((g, gi) =>
      gi === groupIdx ? {
        ...g,
        terms: g.terms.map((t, ti) => ti === termIdx ? { ...t, [field]: nums } : t),
      } : g
    );
    onChange({ ...data, availability: updated });
  };

  const addTerm = (groupIdx: number) => {
    const updated = availability.map((g, i) =>
      i === groupIdx ? { ...g, terms: [...g.terms, { terms: [7], installments: [1] }] } : g
    );
    onChange({ ...data, availability: updated });
  };

  const removeTerm = (groupIdx: number, termIdx: number) => {
    const updated = availability.map((g, i) =>
      i === groupIdx ? { ...g, terms: g.terms.filter((_, ti) => ti !== termIdx) } : g
    );
    onChange({ ...data, availability: updated });
  };

  const addGroup = () => {
    onChange({ ...data, availability: [...availability, { amounts: [100], terms: [{ terms: [7], installments: [1] }] }] });
  };

  const removeGroup = (idx: number) => {
    onChange({ ...data, availability: availability.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-5">
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
                {!readonly ? (
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
            {!readonly && (
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
                {!readonly && availability.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeGroup(groupIdx)} className="h-6 px-2 text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Montos */}
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">Montos (S/)</p>
                {!readonly ? (
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
                  {!readonly && (
                    <Button variant="ghost" size="sm" onClick={() => addTerm(groupIdx)} className="h-5 px-1.5 text-[10px]">
                      <Plus className="h-3 w-3 mr-0.5" /> Plazo
                    </Button>
                  )}
                </div>

                {!readonly ? (
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
                          <th className="text-left px-3 py-1.5 text-xs font-medium text-muted-foreground">Plazo (días)</th>
                          <th className="text-left px-3 py-1.5 text-xs font-medium text-muted-foreground">Cuotas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.terms.map((term, termIdx) => (
                          <tr key={termIdx} className="border-t">
                            <td className="px-3 py-1.5 font-mono text-xs">{term.terms.join(', ')}</td>
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
