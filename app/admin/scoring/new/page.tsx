'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { fetchConfigById, fetchMetadata } from '@/app/admin/scoring/actions';
import type { ScorecardConfig, ScorecardMetadata } from '@/modules/admin/scoring';
import { ConfigEditorTab } from '@/components/admin/scoring/ConfigEditorTab';

export default function ScorecardNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromId = searchParams.get('from');

  const [metadata, setMetadata] = useState<ScorecardMetadata | null>(null);
  const [baseConfig, setBaseConfig] = useState<ScorecardConfig | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const meta = await fetchMetadata();
      setMetadata(meta);

      if (fromId) {
        // Duplicar: cargar la config base y limpiar el ID para crear nueva
        const source = await fetchConfigById(fromId);
        if (source) {
          setBaseConfig({
            ...source,
            id: '', // <- le dice al ConfigEditorTab que es una copia nueva
            name: `${source.name} (copia)`,
            status: 'DRAFT',
            version: 0,
          });
        } else {
          setBaseConfig(null);
        }
      } else {
        setBaseConfig(null); // crear desde cero
      }
      setLoading(false);
    }
    load();
  }, [fromId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!metadata) {
    return <div className="p-6 text-center text-muted-foreground">No se pudo cargar el metadata</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/scoring')} className="gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Volver
        </Button>
        <h1 className="text-lg font-bold">
          {fromId ? 'Duplicar Scorecard' : 'Nuevo Scorecard'}
        </h1>
      </div>

      {/* Reutiliza ConfigEditorTab — config=null crea nueva, config={id:''} es duplicada */}
      <ConfigEditorTab
        config={baseConfig ?? null}
        metadata={metadata}
        onSaved={() => router.push('/admin/scoring')}
        onCancel={() => router.push('/admin/scoring')}
      />
    </div>
  );
}
