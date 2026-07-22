'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Loader2, Plus, Info, AlertTriangle } from 'lucide-react';
import type { ScorecardConfig, ScorecardMetadata, DimensionConfig } from '@/modules/admin/scoring';
import { createNewConfig, updateExistingConfig } from '@/app/admin/scoring/actions';
import { DimensionEditor } from './DimensionEditor';

interface Props {
  config: ScorecardConfig | null; // null = crear nueva, id='' = duplicada
  metadata: ScorecardMetadata;
  onSaved: () => void;
  onCancel: () => void;
}

export function ConfigEditorTab({ config, metadata, onSaved, onCancel }: Props) {
  const isNew = config === null || config.id === '';
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
    if (!name.trim()) { setError('El nombre es requerido'); return; }
    if (dimensions.length === 0) { setError('Agrega al menos una dimensión'); return; }

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
      setError('Error al guardar. Verifica que los datos sean correctos.');
    }
  };

  const addDimension = () => {
    setDimensions([
      ...dimensions,
      { code: `DIM_${dimensions.length + 1}`, name: '', maxPoints: 100, rules: [] },
    ]);
  };

  const removeDimension = (index: number) => {
    if (!confirm('¿Eliminar esta dimensión y todas sus reglas?')) return;
    setDimensions(dimensions.filter((_, i) => i !== index));
  };

  const updateDimension = (index: number, updated: DimensionConfig) => {
    const copy = [...dimensions];
    copy[index] = updated;
    setDimensions(copy);
  };

  const totalMaxPoints = dimensions.reduce((sum, d) => sum + d.maxPoints, 0);
  const totalRules = dimensions.reduce((sum, d) => sum + d.rules.length, 0);
  const pointsMatch = totalMaxPoints === maxScore;

  return (
    <div className="space-y-4">
      {/* Header con info general */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {isNew ? '✨ Nueva configuración' : `📝 ${config?.status === 'ACTIVE' ? 'Viendo' : 'Editando'}: v${config?.version} — ${config?.name}`}
          </CardTitle>
          {isReadonly && (
            <CardDescription className="text-amber-600">
              Esta versión está {config?.status === 'ACTIVE' ? 'activa' : 'archivada'} y no se puede editar. Usa "Duplicar" para crear una copia editable.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cfg-name">Nombre de la versión</Label>
              <Input
                id="cfg-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Ajuste Q3 2026"
                disabled={isReadonly}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cfg-desc">Descripción</Label>
              <Input
                id="cfg-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="¿Qué cambia en esta versión?"
                disabled={isReadonly}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cfg-max">Puntaje máximo total</Label>
              <Input
                id="cfg-max"
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                disabled={isReadonly}
              />
            </div>
          </div>

          {/* Resumen */}
          <div className="flex items-center gap-6 text-sm border-t pt-3">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Dimensiones:</span>
              <strong>{dimensions.length}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Reglas:</span>
              <strong>{totalRules}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Suma de pesos:</span>
              <strong className={pointsMatch ? 'text-green-600' : 'text-amber-600'}>
                {totalMaxPoints}
              </strong>
              <span className="text-muted-foreground">/ {maxScore}</span>
              {pointsMatch && <span className="text-green-600 text-xs">✓</span>}
            </div>
          </div>

          {!pointsMatch && (
            <Alert variant="default" className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 text-xs">
                La suma de los pesos de las dimensiones ({totalMaxPoints}) no coincide con el puntaje máximo ({maxScore}). El score se capeará al máximo configurado.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Info de ayuda */}
      {dimensions.length === 0 && !isReadonly && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Cada dimensión agrupa variables relacionadas. Por ejemplo: "Capacidad de Pago" puede contener reglas sobre ingreso, gastos y deudas. El peso de cada dimensión (puntos máximos) determina su importancia relativa en el score total.
          </AlertDescription>
        </Alert>
      )}

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
        <Button variant="dashed" onClick={addDimension} className="w-full border-dashed">
          <Plus className="h-4 w-4 mr-1.5" /> Agregar dimensión
        </Button>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      {!isReadonly && (
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
            {isNew ? 'Crear borrador' : 'Guardar cambios'}
          </Button>
        </div>
      )}
    </div>
  );
}
