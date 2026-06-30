'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { publishDraftAction, discardDraftAction, saveDraftAction } from '@/app/actions/calculator-admin.actions';
import { toast } from 'sonner';
import type { ConfigEntry, FeeGroup, FeeSplit } from '@/modules/admin/calculator-admin.service';

interface FeeGroupsTabProps {
  config: ConfigEntry;
}

export function FeeGroupsTab({ config }: FeeGroupsTabProps) {
  const [publishing, setPublishing] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const activeData = (config.draft?.data ?? config.published.data) as FeeGroup[];
  const isDraft = config.hasPendingChanges;
  const meta = isDraft ? config.draft! : config.published;

  const [feeGroups, setFeeGroups] = useState<FeeGroup[]>(activeData);

  const handlePublish = async () => {
    setPublishing(true);
    const result = await publishDraftAction('FEE_GROUPS');
    if (result.ok) { toast.success('Tarifas publicadas'); window.location.reload(); }
    else toast.error(result.error ?? 'Error al publicar');
    setPublishing(false);
  };

  const handleDiscard = async () => {
    setDiscarding(true);
    const result = await discardDraftAction('FEE_GROUPS');
    if (result.ok) { toast.success('Borrador descartado'); window.location.reload(); }
    else toast.error(result.error ?? 'Error al descartar');
    setDiscarding(false);
  };

  const handleSaveDraft = async () => {
    // Validar que cada grupo sume 100%
    for (const g of feeGroups) {
      const total = g.splits.reduce((sum, s) => sum + s.percentage, 0);
      if (total !== 100) {
        toast.error(`${g.name}: los porcentajes deben sumar 100% (actual: ${total}%)`);
        return;
      }
    }

    setSaving(true);
    const result = await saveDraftAction('FEE_GROUPS', feeGroups);
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
    setFeeGroups(activeData);
    setEditing(false);
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const updateGroup = (groupIdx: number, field: keyof FeeGroup, value: any) => {
    setFeeGroups((prev) => prev.map((g, i) => i === groupIdx ? { ...g, [field]: value } : g));
  };

  const updateSplit = (groupIdx: number, splitIdx: number, field: keyof FeeSplit, value: any) => {
    setFeeGroups((prev) => prev.map((g, gi) =>
      gi === groupIdx ? {
        ...g,
        splits: g.splits.map((s, si) => si === splitIdx ? { ...s, [field]: field === 'percentage' ? Number(value) : value } : s),
      } : g
    ));
  };

  const addSplit = (groupIdx: number) => {
    setFeeGroups((prev) => prev.map((g, i) =>
      i === groupIdx ? { ...g, splits: [...g.splits, { feeCode: 'NEW_FEE', percentage: 0, label: 'Nuevo cargo' }] } : g
    ));
  };

  const removeSplit = (groupIdx: number, splitIdx: number) => {
    setFeeGroups((prev) => prev.map((g, i) =>
      i === groupIdx ? { ...g, splits: g.splits.filter((_, si) => si !== splitIdx) } : g
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

      {/* Fee Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {feeGroups.map((group, groupIdx) => {
          const total = group.splits.reduce((sum, s) => sum + s.percentage, 0);
          return (
            <Card key={group.groupCode}>
              <CardHeader className="pb-2">
                {editing ? (
                  <div className="space-y-1.5">
                    <Input value={group.name} onChange={(e) => updateGroup(groupIdx, 'name', e.target.value)} className="h-7 text-xs font-medium" />
                    <Input value={group.description} onChange={(e) => updateGroup(groupIdx, 'description', e.target.value)} className="h-7 text-xs" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{group.name}</CardTitle>
                      <Badge variant="outline" className="text-[9px] font-mono">{group.groupCode}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{group.description}</p>
                  </>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.splits.map((split, splitIdx) => (
                    <div key={splitIdx} className="flex items-center justify-between gap-2">
                      {editing ? (
                        <>
                          <Input value={split.label} onChange={(e) => updateSplit(groupIdx, splitIdx, 'label', e.target.value)} className="h-6 text-[11px] flex-1" />
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

                  {editing && (
                    <Button variant="ghost" size="sm" onClick={() => addSplit(groupIdx)} className="w-full h-6 text-[10px]">
                      <Plus className="h-3 w-3 mr-1" /> Agregar cargo
                    </Button>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs font-medium">Total</span>
                    <span className={`text-xs font-mono font-bold ${total !== 100 ? 'text-destructive' : ''}`}>
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
