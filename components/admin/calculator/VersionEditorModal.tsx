'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Save, Loader2, Code } from 'lucide-react';
import { createVersionAction, updateVersionAction } from '@/app/actions/calculator-admin.actions';
import { toast } from 'sonner';
import type { ConfigType, ConfigVersion } from '@/modules/admin/calculator-admin.service';
import { AvailabilityEditor } from './editors/AvailabilityEditor';
import { FeeGroupsEditor } from './editors/FeeGroupsEditor';
import { PricingRulesEditor } from './editors/PricingRulesEditor';

interface VersionEditorModalProps {
  configType: ConfigType;
  version: ConfigVersion | null;
  mode: 'view' | 'edit' | 'create';
  onClose: () => void;
  onSaved: () => void;
}

const TYPE_LABELS: Record<ConfigType, string> = {
  AVAILABILITY: 'Disponibilidad',
  FEE_GROUPS: 'Tarifas',
  PRICING_RULES: 'Reglas de Pricing',
};

export function VersionEditorModal({ configType, version, mode, onClose, onSaved }: VersionEditorModalProps) {
  const isReadonly = mode === 'view';
  const isNew = mode === 'create';

  const [name, setName] = useState(version?.name ?? '');
  const [description, setDescription] = useState(version?.description ?? '');
  const [data, setData] = useState<any>(version?.data ?? getDefaultData(configType));
  const [saving, setSaving] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [jsonText, setJsonText] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    setSaving(true);

    let result;
    if (isNew) {
      result = await createVersionAction(configType, data, name.trim(), description.trim() || undefined);
    } else {
      result = await updateVersionAction(configType, version!.id, data, name.trim(), description.trim() || undefined);
    }

    setSaving(false);

    if (result.ok) {
      toast.success(isNew ? 'Versión creada como DRAFT' : 'Versión actualizada');
      onSaved();
    } else {
      toast.error(result.error ?? 'Error al guardar');
    }
  };

  const toggleJson = () => {
    if (!showJson) {
      setJsonText(JSON.stringify(data, null, 2));
    } else {
      // Al cerrar JSON, intentar parsear los cambios
      try {
        const parsed = JSON.parse(jsonText);
        setData(parsed);
      } catch {
        toast.error('JSON inválido — cambios no aplicados');
      }
    }
    setShowJson(!showJson);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl border shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold">
              {isNew ? `Nueva versión — ${TYPE_LABELS[configType]}` : `${TYPE_LABELS[configType]} v${version?.version}`}
            </h2>
            {version && (
              <Badge
                className={
                  version.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200 text-[10px]' :
                  version.status === 'DRAFT' ? 'border-amber-300 text-amber-700 text-[10px]' :
                  'text-[10px]'
                }
                variant={version.status === 'ARCHIVED' ? 'secondary' : 'outline'}
              >
                {version.status}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isReadonly && (
              <Button variant="ghost" size="sm" onClick={toggleJson} className="text-xs gap-1.5">
                <Code className="h-3.5 w-3.5" />
                {showJson ? 'Visual' : 'JSON'}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ver-name">Nombre</Label>
              <Input
                id="ver-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Ajuste tarifas Julio"
                disabled={isReadonly}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ver-desc">Descripción (opcional)</Label>
              <Input
                id="ver-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="¿Qué cambia en esta versión?"
                disabled={isReadonly}
              />
            </div>
          </div>

          {/* Editor visual o JSON */}
          {showJson ? (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Modo JSON (edición avanzada)</Label>
              <textarea
                className="w-full h-96 font-mono text-xs rounded-lg border p-3 bg-muted/30 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                spellCheck={false}
              />
            </div>
          ) : (
            <>
              {configType === 'AVAILABILITY' && (
                <AvailabilityEditor data={data} onChange={setData} readonly={isReadonly} />
              )}
              {configType === 'FEE_GROUPS' && (
                <FeeGroupsEditor data={data} onChange={setData} readonly={isReadonly} />
              )}
              {configType === 'PRICING_RULES' && (
                <PricingRulesEditor data={data} onChange={setData} readonly={isReadonly} />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isReadonly && (
          <div className="flex justify-end gap-2 px-6 py-4 border-t shrink-0">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
              {isNew ? 'Crear borrador' : 'Guardar cambios'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function getDefaultData(type: ConfigType): any {
  if (type === 'AVAILABILITY') {
    return {
      productId: '550e8400-e29b-41d4-a716-446655440000',
      scoreRanges: [
        { code: 'BAJO', label: 'Bajo', color: '#EF4444', minScore: 0, maxScore: 300, displayOrder: 1 },
        { code: 'MEDIO', label: 'Medio', color: '#F59E0B', minScore: 301, maxScore: 600, displayOrder: 2 },
        { code: 'ALTO', label: 'Alto', color: '#10B981', minScore: 601, maxScore: 999, displayOrder: 3 },
      ],
      availability: [{ amounts: [100], terms: [{ terms: [7], installments: [1] }] }],
    };
  }
  if (type === 'FEE_GROUPS') {
    return [{ groupCode: 'FG-DEFAULT', name: 'Nuevo grupo', description: '', splits: [{ feeCode: 'INTEREST', percentage: 100, label: 'Interés' }] }];
  }
  if (type === 'PRICING_RULES') {
    return {
      productId: '550e8400-e29b-41d4-a716-446655440000',
      rules: [],
    };
  }
  return {};
}
