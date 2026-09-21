'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Copy, Loader2, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { DetailPageHeader } from '@/components/admin/shared';
import { fetchConfigById, fetchMetadata, activateExistingConfig } from '@/app/admin/scoring/actions';
import type { ScorecardConfig, ScorecardMetadata } from '@/modules/admin/scoring';
import { ConfigEditorTab } from '@/components/admin/scoring/ConfigEditorTab';

export default function ScorecardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [config, setConfig] = useState<ScorecardConfig | null>(null);
  const [metadata, setMetadata] = useState<ScorecardMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [c, meta] = await Promise.all([fetchConfigById(id), fetchMetadata()]);
      if (c) setConfig(c);
      setMetadata(meta);
      setLoading(false);
    }
    load();
  }, [id]);

  const isActive = config?.status === 'ACTIVE';

  const handleActivate = async () => {
    if (!confirm('¿Activar esta versión?')) return;
    await activateExistingConfig(id);
    toast.success('Versión activada');
    router.push('/admin/scoring');
  };

  const handleDuplicate = () => {
    router.push(`/admin/scoring/new?from=${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config || !metadata) {
    return <div className="p-6 text-center text-muted-foreground">Configuración no encontrada</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <DetailPageHeader
        icon={<BarChart3 className="h-5 w-5 text-primary" />}
        title={`Scorecard — v${config.version}`}
        badge={isActive ? { label: 'Activa', variant: 'success' } : { label: 'Inactiva', variant: 'secondary' }}
        backHref="/admin/scoring"
        backLabel="Scorecard"
      >
        <div className="flex gap-2">
          {!isActive && (
            <Button variant="outline" size="sm" onClick={handleActivate} className="gap-1.5 text-green-600">
              <Play className="h-3.5 w-3.5" /> Activar
            </Button>
          )}
          <Button size="sm" onClick={handleDuplicate} className="gap-1.5">
            <Copy className="h-3.5 w-3.5" /> Tomar como base
          </Button>
        </div>
      </DetailPageHeader>

      {/* Reutilizar el ConfigEditorTab en modo readonly (ya soporta status ACTIVE = readonly) */}
      <ConfigEditorTab
        config={config}
        metadata={metadata}
        onSaved={() => router.push('/admin/scoring')}
        onCancel={() => router.push('/admin/scoring')}
      />
    </div>
  );
}
