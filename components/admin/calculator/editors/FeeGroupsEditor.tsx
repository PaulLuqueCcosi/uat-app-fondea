'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import type { FeeGroup, FeeSplit } from '@/modules/admin/calculator-admin.service';

interface Props {
  data: FeeGroup[];
  onChange: (data: FeeGroup[]) => void;
  readonly: boolean;
}

export function FeeGroupsEditor({ data, onChange, readonly }: Props) {
  const feeGroups = data ?? [];

  const updateGroup = (groupIdx: number, field: keyof FeeGroup, value: any) => {
    onChange(feeGroups.map((g, i) => i === groupIdx ? { ...g, [field]: value } : g));
  };

  const updateSplit = (groupIdx: number, splitIdx: number, field: keyof FeeSplit, value: any) => {
    onChange(feeGroups.map((g, gi) =>
      gi === groupIdx ? {
        ...g,
        splits: g.splits.map((s, si) => si === splitIdx ? { ...s, [field]: field === 'percentage' ? Number(value) : value } : s),
      } : g
    ));
  };

  const addSplit = (groupIdx: number) => {
    onChange(feeGroups.map((g, i) =>
      i === groupIdx ? { ...g, splits: [...g.splits, { feeCode: 'NEW_FEE', percentage: 0, label: 'Nuevo cargo' }] } : g
    ));
  };

  const removeSplit = (groupIdx: number, splitIdx: number) => {
    onChange(feeGroups.map((g, i) =>
      i === groupIdx ? { ...g, splits: g.splits.filter((_, si) => si !== splitIdx) } : g
    ));
  };

  const addGroup = () => {
    onChange([...feeGroups, { groupCode: `FG-NEW-${feeGroups.length + 1}`, name: 'Nuevo grupo', description: '', splits: [{ feeCode: 'INTEREST', percentage: 100, label: 'Interés' }] }]);
  };

  const removeGroup = (idx: number) => {
    onChange(feeGroups.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {!readonly && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={addGroup}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Agregar grupo
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {feeGroups.map((group, groupIdx) => {
          const total = group.splits.reduce((sum, s) => sum + s.percentage, 0);
          return (
            <Card key={group.groupCode}>
              <CardHeader className="pb-2">
                {!readonly ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Input value={group.name} onChange={(e) => updateGroup(groupIdx, 'name', e.target.value)} className="h-7 text-xs font-medium flex-1" />
                      {feeGroups.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeGroup(groupIdx)} className="h-6 px-2 text-destructive ml-2">
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <Input value={group.description} onChange={(e) => updateGroup(groupIdx, 'description', e.target.value)} className="h-7 text-xs" placeholder="Descripción" />
                    <Input value={group.groupCode} onChange={(e) => updateGroup(groupIdx, 'groupCode', e.target.value)} className="h-7 text-xs font-mono" placeholder="FG-CODE" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{group.name}</CardTitle>
                      <Badge variant="outline" className="text-[9px] font-mono">{group.groupCode}</Badge>
                    </div>
                    {group.description && <p className="text-xs text-muted-foreground">{group.description}</p>}
                  </>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.splits.map((split, splitIdx) => (
                    <div key={splitIdx} className="flex items-center justify-between gap-2">
                      {!readonly ? (
                        <>
                          <Input value={split.label} onChange={(e) => updateSplit(groupIdx, splitIdx, 'label', e.target.value)} className="h-6 text-[11px] flex-1" />
                          <Input value={split.feeCode} onChange={(e) => updateSplit(groupIdx, splitIdx, 'feeCode', e.target.value)} className="h-6 text-[11px] w-24 font-mono" />
                          <Input type="number" value={split.percentage} onChange={(e) => updateSplit(groupIdx, splitIdx, 'percentage', e.target.value)} className="h-6 text-[11px] w-14 font-mono text-right" min={0} max={100} />
                          <span className="text-[11px] text-muted-foreground">%</span>
                          <Button variant="ghost" size="sm" onClick={() => removeSplit(groupIdx, splitIdx)} className="h-5 w-5 p-0 text-destructive">
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-muted-foreground">{split.label}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${split.percentage}%` }} />
                            </div>
                            <span className="text-xs font-mono font-medium w-8 text-right">{split.percentage}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {!readonly && (
                    <Button variant="ghost" size="sm" onClick={() => addSplit(groupIdx)} className="w-full h-6 text-[10px]">
                      <Plus className="h-3 w-3 mr-1" /> Agregar cargo
                    </Button>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs font-medium">Total</span>
                    <span className={`text-xs font-mono font-bold ${total !== 100 ? 'text-destructive' : 'text-green-600'}`}>
                      {total}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
