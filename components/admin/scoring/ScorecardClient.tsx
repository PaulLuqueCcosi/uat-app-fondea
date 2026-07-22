'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ListChecks, Pencil, FlaskConical } from 'lucide-react';
import type { ScorecardConfig, ScorecardMetadata } from '@/modules/admin/scoring';
import { fetchConfigs, fetchMetadata } from '@/app/admin/scoring/actions';
import { ConfigsListTab } from './ConfigsListTab';
import { ConfigEditorTab } from './ConfigEditorTab';
import { SimulateTab } from './SimulateTab';

export function ScorecardClient() {
  const [configs, setConfigs] = useState<ScorecardConfig[]>([]);
  const [metadata, setMetadata] = useState<ScorecardMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('configs');
  const [editingConfig, setEditingConfig] = useState<ScorecardConfig | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [cfgs, meta] = await Promise.all([fetchConfigs(), fetchMetadata()]);
    setConfigs(cfgs || []);
    setMetadata(meta);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleEdit = (config: ScorecardConfig) => {
    setEditingConfig(config);
    setActiveTab('editor');
  };

  const handleDuplicate = (config: ScorecardConfig) => {
    // Crear copia sin ID para que sea un nuevo borrador
    setEditingConfig({
      ...config,
      id: '',
      name: `${config.name} (copia)`,
      status: 'DRAFT',
      version: 0, // se asigna en backend
    });
    setActiveTab('editor');
  };

  const handleCreateNew = () => {
    setEditingConfig(null);
    setActiveTab('editor');
  };

  const handleSaved = () => {
    loadData();
    setActiveTab('configs');
    setEditingConfig(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Cargando configuraciones...</span>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList>
        <TabsTrigger value="configs" className="gap-1.5">
          <ListChecks className="h-4 w-4" />
          Versiones
        </TabsTrigger>
        <TabsTrigger value="editor" className="gap-1.5">
          <Pencil className="h-4 w-4" />
          Editor
        </TabsTrigger>
        <TabsTrigger value="simulate" className="gap-1.5">
          <FlaskConical className="h-4 w-4" />
          Simular
        </TabsTrigger>
      </TabsList>

      <TabsContent value="configs" className="mt-4">
        <ConfigsListTab
          configs={configs}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onCreateNew={handleCreateNew}
          onRefresh={loadData}
        />
      </TabsContent>

      <TabsContent value="editor" className="mt-4">
        {metadata && (
          <ConfigEditorTab
            config={editingConfig}
            metadata={metadata}
            onSaved={handleSaved}
            onCancel={() => setActiveTab('configs')}
          />
        )}
      </TabsContent>

      <TabsContent value="simulate" className="mt-4">
        <SimulateTab configs={configs} />
      </TabsContent>
    </Tabs>
  );
}
