'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createVersionAction, getVersionByIdAction } from '@/app/actions/calculator-admin.actions';
import type { ConfigType, AvailabilityConfig } from '@/modules/admin/calculator-admin.service';
import { AvailabilityEditor } from '@/components/admin/calculator/editors/AvailabilityEditor';
import { FeeGroupsEditor } from '@/components/admin/calculator/editors/FeeGroupsEditor';
import { PricingRulesEditor } from '@/components/admin/calculator/editors/PricingRulesEditor';
import { validateAvailabilityGroups } from '@/components/admin/calculator/editors/AmountsTermsEditor';
import { ConfirmAction } from '@/components/admin/shared/ConfirmAction';

const TYPE_LABELS: Record<string, string> = {
  availability: 'Disponibilidad',
  fee_groups: 'Tarifas',
  pricing_rules: 'Reglas de Pricing',
};

const PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440000';

function getDefaultData(type: string): any {
  if (type === 'availability') {
    return {
      productId: PRODUCT_ID,
      scoreRanges: [
        { code: 'BAJO', label: 'Bajo', color: '#EF4444', minScore: 0, maxScore: 300, displayOrder: 1 },
        { code: 'MEDIO', label: 'Medio', color: '#F59E0B', minScore: 301, maxScore: 600, displayOrder: 2 },
        { code: 'ALTO', label: 'Alto', color: '#10B981', minScore: 601, maxScore: 1000, displayOrder: 3 },
      ],
      availability: [{ amounts: [100], terms: [{ terms: [7], installments: [1] }] }],
    };
  }
  if (type === 'fee_groups') {
    return [{ groupCode: 'FG-DEFAULT', name: 'Nuevo grupo', description: '', splits: [{ feeCode: 'INTEREST', percentage: 100, label: 'Interés' }] }];
  }
  if (type === 'pricing_rules') {
    return { productId: PRODUCT_ID, rules: [] };
  }
  return {};
}

export default function CalculatorNewVersionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = params.type as string;
  const configType = type.toUpperCase() as ConfigType;
  const fromId = searchParams.get('from');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!fromId);
  const [showConfirmCreate, setShowConfirmCreate] = useState(false);
  const [errors, setErrors] = useState<{ name?: boolean; description?: boolean }>({});

  // Si viene ?from={id}, precargar los datos de esa versión
  useEffect(() => {
    if (!fromId) {
      setData(getDefaultData(type));
      return;
    }
    async function loadBase() {
      setLoading(true);
      const v = await getVersionByIdAction(configType, fromId!);
      if (v?.data) {
        setData(v.data);
        setName(`Basada en v${v.version}`);
        setDescription(v.description ?? '');
      } else {
        setData(getDefaultData(type));
      }
      setLoading(false);
    }
    loadBase();
  }, [fromId, type, configType]);

  const handleSave = async () => {
    const newErrors: { name?: boolean; description?: boolean } = {};
    if (!name.trim()) newErrors.name = true;
    if (!description.trim()) newErrors.description = true;
    setErrors(newErrors);

    if (newErrors.name || newErrors.description) {
      toast.error('Completa los campos requeridos');
      return;
    }

    // Validar disponibilidad si es ese tipo
    if (configType === 'AVAILABILITY' && data?.availability) {
      const validationErrors = validateAvailabilityGroups(data.availability);
      if (validationErrors.length > 0) {
        toast.error(`Hay ${validationErrors.length} errores de validación. Corrígelos antes de guardar.`);
        return;
      }
    }

    // Si pasa validación, mostrar modal de confirmación
    setShowConfirmCreate(true);
  };

  const handleConfirmCreate = async () => {
    setSaving(true);
    const result = await createVersionAction(configType, data, name.trim(), description.trim() || undefined);
    setSaving(false);
    if (result.ok) {
      toast.success('Versión creada');
      router.push('/admin/calculator');
    } else {
      toast.error(result.error ?? 'Error al crear');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/calculator')} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver
          </Button>
          <h1 className="text-lg font-bold">
            Nueva versión — {TYPE_LABELS[type] ?? configType}
          </h1>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Crear versión
        </Button>
      </div>

      {/* Metadata */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: false })); }}
                placeholder="Ej: Ajuste tarifas Agosto"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">El nombre es requerido</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Descripción *</Label>
              <Input
                value={description}
                onChange={(e) => { setDescription(e.target.value); setErrors((prev) => ({ ...prev, description: false })); }}
                placeholder="¿Qué incluye esta versión?"
                className={errors.description ? 'border-destructive' : ''}
              />
              {errors.description && <p className="text-xs text-destructive">La descripción es requerida</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Editor */}
      {data && configType === 'AVAILABILITY' && (
        <AvailabilityEditor data={data} onChange={setData} readonly={false} />
      )}
      {data && configType === 'FEE_GROUPS' && (
        <FeeGroupsEditor data={data} onChange={setData} readonly={false} />
      )}
      {data && configType === 'PRICING_RULES' && (
        <PricingRulesEditor data={data} onChange={setData} readonly={false} />
      )}

      {/* Modal de confirmación para crear */}
      <ConfirmAction
        open={showConfirmCreate}
        onOpenChange={setShowConfirmCreate}
        title="¿Crear nueva versión?"
        description={`Se creará "${name.trim() || 'Sin nombre'}" como nueva versión inactiva. Podrás activarla cuando estés listo.`}
        confirmLabel="Sí, crear"
        onConfirm={handleConfirmCreate}
      />
    </div>
  );
}
