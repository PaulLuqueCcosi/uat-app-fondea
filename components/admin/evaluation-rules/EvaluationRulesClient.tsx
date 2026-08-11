'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Gauge, Loader2, ShieldCheck, Target, FlaskConical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

import { ConfigVersionsTable, type ConfigVersionItem } from '@/components/admin/shared/ConfigVersionsTable';
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
  const [activeTab, setActiveTab] = useState<string>('eliminatory');
  const [versions, setVersions] = useState<Record<RuleSetType, RuleSetVersionResponse[]>>({
    eliminatory: [],
    scoring: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      toast.success('Versión activada');
      fetchVersions();
    } else {
      toast.error(res.error ?? 'Error al activar');
    }
  };

  const handleDuplicate = (id: string) => {
    router.push(`/admin/evaluation-rules/new?from=${id}`);
  };

  const handleView = (id: string) => {
    router.push(`/admin/evaluation-rules/${id}`);
  };

  const handleCreateNew = (type: RuleSetType) => {
    router.push(`/admin/evaluation-rules/new?type=${type}`);
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

  // Map to shared format
  const mapVersions = (list: RuleSetVersionResponse[]): ConfigVersionItem[] =>
    list.map((v) => ({
      id: v.id,
      version: Number(v.version) || 0,
      name: v.description,
      isActive: v.active,
      createdAt: v.createdAt,
    }));

  return (
    <Tabs value={activeTab} onValueChange={(v) => { if (v) setActiveTab(v); }} className="w-full">
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
        <TabsTrigger value="simulate" className="gap-1.5 text-xs px-3">
          <FlaskConical className="h-3.5 w-3.5" />
          Simular
        </TabsTrigger>
      </TabsList>

      <TabsContent value="eliminatory" className="mt-4">
        <ConfigVersionsTable
          versions={mapVersions(versions.eliminatory)}
          onView={handleView}
          onDuplicate={handleDuplicate}
          onActivate={handleActivate}
          onCreate={() => handleCreateNew('eliminatory')}
          label="Eliminatorias"
        />
      </TabsContent>

      <TabsContent value="scoring" className="mt-4">
        <ConfigVersionsTable
          versions={mapVersions(versions.scoring)}
          onView={handleView}
          onDuplicate={handleDuplicate}
          onActivate={handleActivate}
          onCreate={() => handleCreateNew('scoring')}
          label="Scoring"
        />
      </TabsContent>

      <TabsContent value="thresholds" className="mt-4">
        <ThresholdsPanel />
      </TabsContent>

      <TabsContent value="simulate" className="mt-4">
        <SimulationPanel versions={[...versions.eliminatory, ...versions.scoring]} />
      </TabsContent>
    </Tabs>
  );
}
