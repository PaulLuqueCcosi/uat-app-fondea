'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Eye, GripVertical, Plus, Trash2 } from 'lucide-react';
import { RuleQueryBuilder } from './RuleQueryBuilder';
import type { FieldGroup } from '@/modules/admin/admin-evaluation-rules.service';

interface RuleEditorProps {
  modules: any[];
  onChange: (modules: any[]) => void;
  fieldGroups: FieldGroup[];
  type: 'eliminatory' | 'scoring';
}

/**
 * Editor completo de módulos y reglas.
 * Permite editar cada regla con el QueryBuilder visual o con JSON.
 */
export function RuleEditor({ modules, onChange, fieldGroups, type }: RuleEditorProps) {
  const [expandedModule, setExpandedModule] = useState<number | null>(0);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'visual' | 'json'>('visual');

  const updateModule = (moduleIdx: number, updated: any) => {
    const newModules = [...modules];
    newModules[moduleIdx] = updated;
    onChange(newModules);
  };

  const updateRule = (moduleIdx: number, ruleIdx: number, updatedRule: any) => {
    const newModules = [...modules];
    const newRules = [...newModules[moduleIdx].rules];
    newRules[ruleIdx] = updatedRule;
    newModules[moduleIdx] = { ...newModules[moduleIdx], rules: newRules };
    onChange(newModules);
  };

  const addRule = (moduleIdx: number) => {
    const newModules = [...modules];
    const newRule = type === 'scoring'
      ? { id: `rule-${Date.now()}`, label: 'Nueva regla', description: '', category: 'profile', points: 0, logic: {} }
      : { id: `rule-${Date.now()}`, label: 'Nueva regla', description: '', logic: {} };
    newModules[moduleIdx] = {
      ...newModules[moduleIdx],
      rules: [...newModules[moduleIdx].rules, newRule],
    };
    onChange(newModules);
    setExpandedRule(`${moduleIdx}-${newModules[moduleIdx].rules.length - 1}`);
  };

  const removeRule = (moduleIdx: number, ruleIdx: number) => {
    const newModules = [...modules];
    newModules[moduleIdx] = {
      ...newModules[moduleIdx],
      rules: newModules[moduleIdx].rules.filter((_: any, i: number) => i !== ruleIdx),
    };
    onChange(newModules);
    setExpandedRule(null);
  };

  const addModule = () => {
    const newModule = {
      module: `new-module-${Date.now()}`,
      label: 'Nuevo módulo',
      productId: '550e8400-e29b-41d4-a716-446655440000',
      version: '1.0.0',
      rules: [],
    };
    onChange([...modules, newModule]);
    setExpandedModule(modules.length);
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{modules.length} módulo(s)</span>
        <Tabs value={editMode} onValueChange={(v) => setEditMode(v as 'visual' | 'json')}>
          <TabsList className="h-7">
            <TabsTrigger value="visual" className="text-[11px] h-6 px-2 gap-1">
              <Eye className="h-3 w-3" />Visual
            </TabsTrigger>
            <TabsTrigger value="json" className="text-[11px] h-6 px-2 gap-1">
              <Code className="h-3 w-3" />JSON
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {editMode === 'json' ? (
        <Textarea
          rows={20}
          value={JSON.stringify(modules, null, 2)}
          onChange={(e) => {
            try { onChange(JSON.parse(e.target.value)); } catch { /* invalid json */ }
          }}
          className="font-mono text-[11px] leading-tight"
        />
      ) : (
        <>
          {modules.map((mod, moduleIdx) => (
            <Card key={moduleIdx} className={expandedModule === moduleIdx ? 'border-primary/40' : ''}>
              <CardHeader
                className="py-2.5 px-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedModule(expandedModule === moduleIdx ? null : moduleIdx)}
              >
                <CardTitle className="text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{mod.label || mod.module}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {mod.rules?.length ?? 0} regla{(mod.rules?.length ?? 0) !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[10px] text-muted-foreground">{mod.module}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive/60 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newModules = modules.filter((_, i) => i !== moduleIdx);
                        onChange(newModules);
                        if (expandedModule === moduleIdx) setExpandedModule(null);
                      }}
                      title="Eliminar módulo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>

              {expandedModule === moduleIdx && (
                <CardContent className="pt-0 px-4 pb-3 space-y-3">
                  {/* Module metadata */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Nombre interno</Label>
                      <Input
                        value={mod.module}
                        onChange={(e) => updateModule(moduleIdx, { ...mod, module: e.target.value })}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Etiqueta</Label>
                      <Input
                        value={mod.label}
                        onChange={(e) => updateModule(moduleIdx, { ...mod, label: e.target.value })}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>

                  {/* Rules */}
                  <div className="space-y-2">
                    {(mod.rules ?? []).map((rule: any, ruleIdx: number) => {
                      const ruleKey = `${moduleIdx}-${ruleIdx}`;
                      const isExpanded = expandedRule === ruleKey;

                      return (
                        <div key={rule.id ?? ruleIdx} className="border rounded-md bg-muted/10">
                          {/* Rule header */}
                          <div
                            className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/20 transition-colors"
                            onClick={() => setExpandedRule(isExpanded ? null : ruleKey)}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-medium truncate">{rule.label || rule.id}</span>
                              {type === 'scoring' && rule.points !== undefined && (
                                <Badge
                                  variant={rule.points >= 0 ? 'default' : 'destructive'}
                                  className="text-[9px] h-4 px-1"
                                >
                                  {rule.points > 0 ? '+' : ''}{rule.points}
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive/60 hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); removeRule(moduleIdx, ruleIdx); }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Rule editor expanded */}
                          {isExpanded && (
                            <div className="px-3 pb-3 space-y-3 border-t bg-background">
                              <div className="space-y-1 pt-2">
                                <Label className="text-[10px]">Nombre de la regla</Label>
                                <Input
                                  value={rule.label}
                                  onChange={(e) => updateRule(moduleIdx, ruleIdx, { ...rule, label: e.target.value })}
                                  className="h-7 text-xs"
                                  placeholder="Ej: Edad mínima 18 años"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-[10px]">Descripción</Label>
                                <Input
                                  value={rule.description ?? ''}
                                  onChange={(e) => updateRule(moduleIdx, ruleIdx, { ...rule, description: e.target.value })}
                                  className="h-7 text-xs"
                                  placeholder="Explica por qué existe esta regla..."
                                />
                              </div>

                              {/* Scoring-specific: points + category */}
                              {type === 'scoring' && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-[10px]">Puntos</Label>
                                    <Input
                                      type="number"
                                      value={rule.points ?? 0}
                                      onChange={(e) => updateRule(moduleIdx, ruleIdx, { ...rule, points: Number(e.target.value) })}
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[10px]">Categoría</Label>
                                    <Select
                                      value={rule.category ?? 'profile'}
                                      onValueChange={(v) => updateRule(moduleIdx, ruleIdx, { ...rule, category: v })}
                                    >
                                      <SelectTrigger className="h-7 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="profile">Perfil</SelectItem>
                                        <SelectItem value="cross">Cruzada</SelectItem>
                                        <SelectItem value="antifraud">Antifraude</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}

                              {/* JsonLogic editor */}
                              <div className="space-y-1">
                                <Label className="text-[10px]">Lógica (JsonLogic)</Label>
                                <RuleQueryBuilder
                                  logic={rule.logic}
                                  onChange={(newLogic) => updateRule(moduleIdx, ruleIdx, { ...rule, logic: newLogic })}
                                  fieldGroups={fieldGroups}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => addRule(moduleIdx)}>
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar regla
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}

          <Button variant="outline" size="sm" className="w-full" onClick={addModule}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Agregar módulo
          </Button>
        </>
      )}
    </div>
  );
}
