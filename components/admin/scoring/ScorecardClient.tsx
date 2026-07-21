'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
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
        <TabsTrigger value="configs">Versiones</TabsTrigger>
        <TabsTrigger value="editor">Editor</TabsTrigger>
        <TabsTrigger value="simulate">Simular</TabsTrigger>
      </TabsList>

      <TabsContent value="configs" className="mt-4">
        <ConfigsListTab
          configs={configs}
          onEdit={handleEdit}
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
