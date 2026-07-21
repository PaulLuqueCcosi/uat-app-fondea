'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Save, ShieldCheck, Target } from 'lucide-react';
import { RuleEditor } from './RuleEditor';
import {
  getVersionByIdAction,
  createVersionAction,
  listVersionsAction,
  getAvailableFieldsAction,
} from '@/app/actions/admin-evaluation-rules.actions';
import type { FieldGroup, RuleSetType, RuleSetVersionResponse } from '@/modules/admin/admin-evaluation-rules.service';

const DEFAULT_PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440000';

interface RuleEditorPageProps {
  /** ID de la versión a duplicar (si viene de "editar" o "duplicar") */
  duplicateFromId?: string;
}

export function RuleEditorPage({ duplicateFromId }: RuleEditorPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') as RuleSetType | null;

  // State
  const [type, setType] = useState<RuleSetType>(typeParam ?? 'eliminatory');
  const [version, setVersion] = useState('');
  const [description, setDescription] = useState('');
  const [modules, setModules] = useState<any[]>([]);
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([]);
  const [existingVersions, setExistingVersions] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versionError, setVersionError] = useState<string | null>(null);
  const [baseVersion, setBaseVersion] = useState<RuleSetVersionResponse | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    async function init() {
      setLoading(true);

      // 1. Cargar campos disponibles
      const fieldsRes = await getAvailableFieldsAction();
      if (fieldsRes.ok && fieldsRes.data) {
        setFieldGroups(fieldsRes.data.groups);
      }

      // 2. Si es duplicar, cargar la versión base
      if (duplicateFromId) {
        const versionRes = await getVersionByIdAction(duplicateFromId);
        if (versionRes.ok && versionRes.data) {
          const base = versionRes.data;
          setBaseVersion(base);
          setType(base.type);
          setModules(JSON.parse(JSON.stringify(
            Array.isArray(base.rulesJson) ? base.rulesJson : []
          )));
          setDescription(`Basada en v${base.version}`);
          // Sugerir siguiente versión
          const parts = base.version.split('.');
          if (parts.length === 3) {
            parts[2] = String(Number(parts[2]) + 1);
            setVersion(parts.join('.'));
          }
        }
      }

      // 3. Cargar versiones existentes para validar duplicados
      const [elimRes, scoringRes] = await Promise.all([
        listVersionsAction('eliminatory'),
        listVersionsAction('scoring'),
      ]);
      const allVersions = [
        ...(elimRes.ok && elimRes.data ? elimRes.data : []),
        ...(scoringRes.ok && scoringRes.data ? scoringRes.data : []),
      ];
      setExistingVersions(allVersions.map(v => `${v.type}:${v.version}`));

      setLoading(false);
    }
    init();
  }, [duplicateFromId]);

  // Validar versión duplicada en tiempo real
  useEffect(() => {
    if (!version.trim()) {
      setVersionError(null);
      return;
    }
    const key = `${type}:${version.trim()}`;
    if (existingVersions.includes(key)) {
      setVersionError(`Ya existe una versión "${version}" para ${type === 'eliminatory' ? 'eliminatorias' : 'scoring'}.`);
    } else {
      setVersionError(null);
    }
  }, [version, type, existingVersions]);

  const handleSave = async () => {
    setError(null);

    if (!version.trim()) {
      setError('Ingresa un número de versión.');
      return;
    }
    if (versionError) {
      setError(versionError);
      return;
    }
    if (modules.length === 0) {
      setError('Agrega al menos un módulo con reglas.');
      return;
    }
    const emptyModule = modules.find(m => !m.rules || m.rules.length === 0);
    if (emptyModule) {
      setError(`El módulo "${emptyModule.label || emptyModule.module}" no tiene reglas.`);
      return;
    }

    setSaving(true);

    // Limpiar campo 'field' de las reglas (ya no se usa) y asegurar IDs únicos
    const cleanedModules = modules.map(mod => ({
      ...mod,
      rules: (mod.rules ?? []).map((rule: any) => {
        const { field, ...rest } = rule;
        // Si no tiene ID, generar uno
        if (!rest.id) rest.id = `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        return rest;
      }),
    }));

    const res = await createVersionAction({
      productId: DEFAULT_PRODUCT_ID,
      type,
      version: version.trim(),
      description: description.trim() || undefined,
      rulesJson: cleanedModules,
    });

    if (res.ok) {
      router.push('/admin/evaluation-rules');
    } else {
      setError(res.error ?? 'Error al guardar');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Cargando editor...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push('/admin/evaluation-rules')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {baseVersion ? 'Duplicar versión' : 'Nueva versión de reglas'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {baseVersion
                ? `Editando copia de v${baseVersion.version} (${baseVersion.type})`
                : 'Configura las reglas y guarda como nueva versión inactiva'}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || !!versionError} size="sm">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
          Guardar versión
        </Button>
      </div>

      <Separator />

      {/* Metadata */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Información de la versión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo *</Label>
              <Select value={type} onValueChange={(v) => setType(v as RuleSetType)} disabled={!!baseVersion}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eliminatory">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" /> Eliminatoria
                    </span>
                  </SelectItem>
                  <SelectItem value="scoring">
                    <span className="flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5" /> Scoring
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Versión *</Label>
              <Input
                placeholder="1.1.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className={`h-8 text-sm ${versionError ? 'border-destructive' : ''}`}
              />
              {versionError && (
                <p className="text-[10px] text-destructive">{versionError}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Descripción</Label>
              <Input
                placeholder="Qué cambiaste en esta versión..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {baseVersion && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2">
              <span>Basada en:</span>
              <Badge variant="secondary" className="text-[10px]">v{baseVersion.version}</Badge>
              <span>—</span>
              <span>{baseVersion.description ?? 'Sin descripción'}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rule Editor (full width) */}
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            Reglas — {type === 'eliminatory' ? 'Eliminatorias' : 'Scoring'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RuleEditor
            modules={modules}
            onChange={setModules}
            fieldGroups={fieldGroups}
            type={type}
          />
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Bottom save bar */}
      <div className="sticky bottom-0 bg-background border-t py-3 flex justify-end gap-2 -mx-4 px-4 md:-mx-6 md:px-6">
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/evaluation-rules')}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving || !!versionError} size="sm">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
          Guardar versión
        </Button>
      </div>
    </div>
  );
}
