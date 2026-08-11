'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ListChecks, FlaskConical } from 'lucide-react';
import type { ScorecardConfig } from '@/modules/admin/scoring';
import { fetchConfigs } from '@/app/admin/scoring/actions';
import { activateExistingConfig } from '@/app/admin/scoring/actions';
import { ConfigVersionsTable, type ConfigVersionItem } from '@/components/admin/shared/ConfigVersionsTable';
import { SimulateTab } from './SimulateTab';
import { toast } from 'sonner';

export function ScorecardClient() {
  const router = useRouter();
  const [configs, setConfigs] = useState<ScorecardConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('configs');

  const loadData = async () => {
    setLoading(true);
    const cfgs = await fetchConfigs();
    setConfigs(cfgs || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleActivate = async (id: string) => {
    await activateExistingConfig(id);
    toast.success('Versión activada');
    loadData();
  };

  const handleDuplicate = (id: string) => {
    router.push(`/admin/scoring/new?from=${id}`);
  };

  const handleView = (id: string) => {
    router.push(`/admin/scoring/${id}`);
  };

  const handleCreateNew = () => {
    router.push('/admin/scoring/new');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Cargando configuraciones...</span>
      </div>
    );
  }

  // Map to shared component format
  const items: ConfigVersionItem[] = configs.map((c) => ({
    id: c.id,
    version: c.version,
    name: c.name,
    description: c.description,
    isActive: c.status === 'ACTIVE',
    createdAt: c.createdAt,
    activatedAt: c.activatedAt,
    meta: `${c.dimensions.length} dimensiones, ${c.dimensions.reduce((sum, d) => sum + d.rules.length, 0)} reglas`,
  }));

  return (
    <Tabs value={activeTab} onValueChange={(v) => { if (v) setActiveTab(v); }} className="w-full">
      <TabsList className="h-9 p-1">
        <TabsTrigger value="configs" className="gap-1.5 text-xs px-4">
          <ListChecks className="h-3.5 w-3.5" />
          Versiones
        </TabsTrigger>
        <TabsTrigger value="simulate" className="gap-1.5 text-xs px-4">
          <FlaskConical className="h-3.5 w-3.5" />
          Simular
        </TabsTrigger>
      </TabsList>

      <TabsContent value="configs" className="mt-4">
        <ConfigVersionsTable
          versions={items}
          onView={handleView}
          onDuplicate={handleDuplicate}
          onActivate={handleActivate}
          onCreate={handleCreateNew}
          label="Scorecard"
        />
      </TabsContent>

      <TabsContent value="simulate" className="mt-4">
        <SimulateTab configs={configs} />
      </TabsContent>
    </Tabs>
  );
}
