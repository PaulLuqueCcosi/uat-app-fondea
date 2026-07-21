'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Loader2, Plus, Trash2 } from 'lucide-react';
import type { ScorecardConfig, ScorecardMetadata, DimensionConfig } from '@/modules/admin/scoring';
import { createNewConfig, updateExistingConfig } from '@/app/admin/scoring/actions';
import { DimensionEditor } from './DimensionEditor';

interface Props {
  config: ScorecardConfig | null; // null = crear nueva
  metadata: ScorecardMetadata;
  onSaved: () => void;
  onCancel: () => void;
}

export function ConfigEditorTab({ config, metadata, onSaved, onCancel }: Props) {
  const isNew = config === null;
  const isReadonly = config?.status === 'ACTIVE' || config?.status === 'ARCHIVED';

  const [name, setName] = useState(config?.name || '');
  const [description, setDescription] = useState(config?.description || '');
  const [maxScore, setMaxScore] = useState(config?.maxScore || 1000);
  const [dimensions, setDimensions] = useState<DimensionConfig[]>(
    config?.dimensions || []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (dimensions.length === 0) {
      setError('Agrega al menos una dimensión');
      return;
    }

    setSaving(true);
    setError(null);

    const data = {
      name: name.trim(),
      description: description.trim(),
      maxScore,
      dimensionsJson: JSON.stringify(dimensions),
    };

    let result;
    if (isNew) {
      result = await createNewConfig(data);
    } else {
      result = await updateExistingConfig(config!.id, data);
    }

    setSaving(false);

    if (result) {
      onSaved();
    } else {
      setError('Error al guardar. Verifica los datos.');
    }
  };

  const addDimension = () => {
    setDimensions([
      ...dimensions,
      { code: `DIM_${dimensions.length + 1}`, name: '', maxPoints: 100, rules: [] },
    ]);
  };

  const removeDimension = (index: number) => {
    setDimensions(dimensions.filter((_, i) => i !== index));
  };

  const updateDimension = (index: number, updated: DimensionConfig) => {
    const copy = [...dimensions];
    copy[index] = updated;
    setDimensions(copy);
  };

  const totalMaxPoints = dimensions.reduce((sum, d) => sum + d.maxPoints, 0);

  return (
    <div className="space-y-4">
      {/* Header info */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">
            {isNew ? 'Nueva configuración' : `Editando: v${config?.version} — ${config?.name}`}
            {isReadonly && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">(solo lectura)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="cfg-name">Nombre</Label>
              <Input
                id="cfg-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Configuración Q3 2026"
                disabled={isReadonly}
              />
            </div>
            <div>
              <Label htmlFor="cfg-desc">Descripción</Label>
              <Input
                id="cfg-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción corta"
                disabled={isReadonly}
              />
            </div>
            <div>
              <Label htmlFor="cfg-max">Score máximo</Label>
              <Input
                id="cfg-max"
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                disabled={isReadonly}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Suma de dimensiones: <strong className={totalMaxPoints !== maxScore ? 'text-amber-600' : 'text-green-600'}>{totalMaxPoints}</strong> / {maxScore}</span>
            {totalMaxPoints !== maxScore && (
              <span className="text-amber-600 text-xs">⚠️ La suma de maxPoints no coincide con el score máximo</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dimensiones */}
      <div className="space-y-3">
        {dimensions.map((dim, i) => (
          <DimensionEditor
            key={`${dim.code}-${i}`}
            dimension={dim}
            index={i}
            metadata={metadata}
            readonly={isReadonly}
            onChange={(updated) => updateDimension(i, updated)}
            onRemove={() => removeDimension(i)}
          />
        ))}
      </div>

      {/* Agregar dimensión */}
      {!isReadonly && (
        <Button variant="outline" onClick={addDimension} className="w-full">
          <Plus className="h-4 w-4 mr-1" /> Agregar dimensión
        </Button>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
      )}

      {/* Actions */}
      {!isReadonly && (
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            {isNew ? 'Crear borrador' : 'Guardar cambios'}
          </Button>
        </div>
      )}
    </div>
  );
}
