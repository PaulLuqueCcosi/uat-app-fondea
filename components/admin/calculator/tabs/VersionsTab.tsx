'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ConfigVersionsTable, type ConfigVersionItem } from '@/components/admin/shared/ConfigVersionsTable';
import {
  getVersionsAction,
  activateVersionAction,
} from '@/app/actions/calculator-admin.actions';
import { toast } from 'sonner';
import type { ConfigType, ConfigVersion } from '@/modules/admin/calculator-admin.service';

interface VersionsTabProps {
  configType: ConfigType;
  activeVersion: ConfigVersion | null;
}

const TYPE_LABELS: Record<ConfigType, string> = {
  AVAILABILITY: 'Disponibilidad',
  FEE_GROUPS: 'Tarifas',
  PRICING_RULES: 'Reglas de Pricing',
};

export function VersionsTab({ configType, activeVersion }: VersionsTabProps) {
  const router = useRouter();
  const [versions, setVersions] = useState<ConfigVersion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    const result = await getVersionsAction(configType);
    setVersions(result);
    setLoading(false);
  }, [configType]);

  useEffect(() => { fetchVersions(); }, [fetchVersions]);

  const handleActivate = async (id: string) => {
    const result = await activateVersionAction(configType, id);
    if (result.ok) {
      if (result.warning) {
        // Se activó, pero dejó a Reglas de Pricing incompatible y el backend la
        // desactivó en cascada — el simulador de préstamos quedó sin reglas activas.
        // Esto NO puede ser un toast que desaparece: es un aviso de "algo se rompió".
        toast.warning(result.warning, {
          description: result.pricingValidationErrors?.join(' · '),
          duration: 15000,
        });
      } else {
        toast.success('Versión activada');
      }
      fetchVersions();
    } else {
      toast.error(result.error ?? 'Error al activar');
    }
  };

  const handleDuplicate = async (id: string) => {
    router.push(`/admin/calculator/${configType.toLowerCase()}/new?from=${id}`);
  };

  const handleView = (id: string) => {
    router.push(`/admin/calculator/${configType.toLowerCase()}/${id}`);
  };

  const handleCreate = () => {
    router.push(`/admin/calculator/${configType.toLowerCase()}/new`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-32 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  // Map to shared component format
  const items: ConfigVersionItem[] = versions.map((v) => ({
    id: v.id,
    version: v.version,
    name: v.name,
    description: v.description,
    isActive: v.isActive,
    createdAt: v.createdAt,
    createdBy: v.createdBy,
    activatedAt: v.activatedAt,
  }));

  return (
    <ConfigVersionsTable
      versions={items}
      onView={handleView}
      onDuplicate={handleDuplicate}
      onActivate={handleActivate}
      onCreate={handleCreate}
      label={TYPE_LABELS[configType]}
    />
  );
}
