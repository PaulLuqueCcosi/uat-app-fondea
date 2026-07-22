'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Copy, Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getVersionByIdAction, activateVersionAction } from '@/app/actions/calculator-admin.actions';
import type { ConfigType, ConfigVersion } from '@/modules/admin/calculator-admin.service';
import { AvailabilityEditor } from '@/components/admin/calculator/editors/AvailabilityEditor';
import { FeeGroupsEditor } from '@/components/admin/calculator/editors/FeeGroupsEditor';
import { PricingRulesEditor } from '@/components/admin/calculator/editors/PricingRulesEditor';
import { ConfirmAction } from '@/components/admin/shared/ConfirmAction';

const TYPE_LABELS: Record<string, string> = {
  availability: 'Disponibilidad',
  fee_groups: 'Tarifas',
  pricing_rules: 'Reglas de Pricing',
};

export default function CalculatorVersionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const type = params.type as string;
  const configType = type.toUpperCase() as ConfigType;
  const versionId = params.id as string;

  const [version, setVersion] = useState<ConfigVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActivateModal, setShowActivateModal] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const v = await getVersionByIdAction(configType, versionId);
      if (v) setVersion(v);
      setLoading(false);
    }
    load();
  }, [configType, versionId]);

  const handleActivate = async () => {
    const result = await activateVersionAction(configType, versionId);
    if (result.ok) {
      toast.success('Versión activada');
      router.push('/admin/calculator');
    } else {
      toast.error(result.error ?? 'Error al activar');
    }
  };

  const handleUseAsBase = () => {
    router.push(`/admin/calculator/${type}/new?from=${versionId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!version) {
    return <div className="p-6 text-center text-muted-foreground">Versión no encontrada</div>;
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
            {TYPE_LABELS[type] ?? configType} — v{version.version}
          </h1>
          {version.isActive && (
            <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">Activa</Badge>
          )}
        </div>
        <div className="flex gap-2">
          {!version.isActive && (
            <Button variant="outline" size="sm" onClick={() => setShowActivateModal(true)} className="gap-1.5 text-green-600">
              <Play className="h-3.5 w-3.5" /> Activar
            </Button>
          )}
          <Button size="sm" onClick={handleUseAsBase} className="gap-1.5">
            <Copy className="h-3.5 w-3.5" /> Tomar como base
          </Button>
        </div>
      </div>

      {/* Metadata inline */}
      <div className="flex items-center gap-4 text-sm">
        <span><span className="text-muted-foreground">Nombre:</span> <span className="font-medium">{version.name ?? '—'}</span></span>
        {version.description && (
          <span><span className="text-muted-foreground">Descripción:</span> {version.description}</span>
        )}
        <span><span className="text-muted-foreground">Fecha creación:</span> {new Date(version.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
      </div>

      {/* Visual Editor — READONLY */}
      {version.data && configType === 'AVAILABILITY' && (
        <AvailabilityEditor data={version.data} onChange={() => {}} readonly={true} />
      )}
      {version.data && configType === 'FEE_GROUPS' && (
        <FeeGroupsEditor data={version.data} onChange={() => {}} readonly={true} />
      )}
      {version.data && configType === 'PRICING_RULES' && (
        <PricingRulesEditor data={version.data} onChange={() => {}} readonly={true} />
      )}

      {/* Modal de confirmación para activar */}
      <ConfirmAction
        open={showActivateModal}
        onOpenChange={setShowActivateModal}
        title="¿Activar esta versión?"
        description="La versión activa actual será reemplazada. Los clientes verán los cambios inmediatamente."
        confirmLabel="Sí, activar"
        onConfirm={handleActivate}
      />
    </div>
  );
}
