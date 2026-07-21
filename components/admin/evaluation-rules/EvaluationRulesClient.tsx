'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Gauge, Loader2, ShieldCheck, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

import { VersionsTable } from './VersionsTable';
import { VersionDetail } from './VersionDetail';
import { SimulationPanel } from './SimulationPanel';
import { ThresholdsPanel } from './ThresholdsPanel';

import {
  listVersionsAction,
  activateVersionAction,
  deactivateVersionAction,
} from '@/app/actions/admin-evaluation-rules.actions';
import type { RuleSetVersionResponse, RuleSetType } from '@/modules/admin/admin-evaluation-rules.service';

export function EvaluationRulesClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RuleSetType | 'thresholds'>('eliminatory');
  const [versions, setVersions] = useState<Record<RuleSetType, RuleSetVersionResponse[]>>({
    eliminatory: [],
    scoring: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<RuleSetVersionResponse | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [elimRes, scoringRes] = await Promise.all([
      listVersionsAction('eliminatory'),
      listVersionsAction('scoring'),
    ]);

    if (!elimRes.ok || !scoringRes.ok) {
      setError(elimRes.error || scoringRes.error || 'Error al cargar versiones');
      setLoading(false);
      return;
    }

    setVersions({
      eliminatory: elimRes.data ?? [],
      scoring: scoringRes.data ?? [],
    });
    setLoading(false);
  }, []);

  useEffect(() => { fetchVersions(); }, [fetchVersions]);

  const handleActivate = async (id: string) => {
    const res = await activateVersionAction(id);
    if (res.ok) {
      await fetchVersions();
      setSelectedVersion(null);
    } else {
      alert(res.error ?? 'Error al activar');
    }
  };

  const handleDeactivate = async (id: string) => {
    const res = await deactivateVersionAction(id);
    if (res.ok) {
      await fetchVersions();
      setSelectedVersion(null);
    } else {
      alert(res.error ?? 'Error al desactivar');
    }
  };

  const handleCreateNew = (type: RuleSetType) => {
    router.push(`/admin/evaluation-rules/new?type=${type}`);
  };

  const handleDuplicate = (version: RuleSetVersionResponse) => {
    router.push(`/admin/evaluation-rules/${version.id}/edit`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Cargando reglas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive font-medium">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchVersions}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const activeElim = versions.eliminatory.find(v => v.active);
  const activeScoring = versions.scoring.find(v => v.active);

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Eliminatoria activa:</span>
          {activeElim ? (
            <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">v{activeElim.version}</Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">Fallback JSON</Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Scoring activo:</span>
          {activeScoring ? (
            <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">v{activeScoring.version}</Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">Fallback JSON</Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as RuleSetType | 'thresholds'); setSelectedVersion(null); }}>
        <TabsList className="h-9 p-1">
          <TabsTrigger value="eliminatory" className="gap-1.5 text-xs px-3">
            <ShieldCheck className="h-3.5 w-3.5" />
            Eliminatorias
            <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">{versions.eliminatory.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="scoring" className="gap-1.5 text-xs px-3">
            <Target className="h-3.5 w-3.5" />
            Scoring
            <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">{versions.scoring.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="thresholds" className="gap-1.5 text-xs px-3">
            <Gauge className="h-3.5 w-3.5" />
            Umbrales
          </TabsTrigger>
        </TabsList>

        <TabsContent value="eliminatory" className="mt-4">
          <VersionsTable
            versions={versions.eliminatory}
            selectedId={selectedVersion?.id ?? null}
            onSelect={setSelectedVersion}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            onCreateNew={() => handleCreateNew('eliminatory')}
            onDuplicate={handleDuplicate}
          />
        </TabsContent>

        <TabsContent value="scoring" className="mt-4">
          <VersionsTable
            versions={versions.scoring}
            selectedId={selectedVersion?.id ?? null}
            onSelect={setSelectedVersion}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            onCreateNew={() => handleCreateNew('scoring')}
            onDuplicate={handleDuplicate}
          />
        </TabsContent>

        <TabsContent value="thresholds" className="mt-4">
          <ThresholdsPanel />
        </TabsContent>
      </Tabs>

      {/* Detail panel */}
      {selectedVersion && (
        <VersionDetail
          version={selectedVersion}
          onClose={() => setSelectedVersion(null)}
        />
      )}

      {/* Simulation */}
      <SimulationPanel versions={[...versions.eliminatory, ...versions.scoring]} />
    </div>
  );
}
