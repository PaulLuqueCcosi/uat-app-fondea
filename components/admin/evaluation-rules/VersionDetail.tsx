'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Eye, X } from 'lucide-react';
import { useState } from 'react';
import { RuleModuleCard } from './RuleModuleCard';
import type { RuleSetVersionResponse } from '@/modules/admin/admin-evaluation-rules.service';

interface VersionDetailProps {
  version: RuleSetVersionResponse;
  onClose: () => void;
}

export function VersionDetail({ version, onClose }: VersionDetailProps) {
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
  const modules = Array.isArray(version.rulesJson) ? version.rulesJson : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>v{version.version}</span>
            {version.active && (
              <Badge className="bg-green-50 text-green-700 border-green-200">Activa</Badge>
            )}
            <span className="text-xs font-normal text-muted-foreground">
              — {version.type === 'eliminatory' ? 'Eliminatoria' : 'Scoring'}
            </span>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'visual' | 'json')}>
              <TabsList className="h-7">
                <TabsTrigger value="visual" className="text-xs h-6 px-2">Visual</TabsTrigger>
                <TabsTrigger value="json" className="text-xs h-6 px-2">
                  <Code className="h-3 w-3 mr-1" />JSON
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {version.description && (
          <p className="text-xs text-muted-foreground mt-1">{version.description}</p>
        )}
      </CardHeader>
      <CardContent>
        {viewMode === 'visual' ? (
          <div className="space-y-3">
            {modules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin módulos configurados</p>
            ) : (
              modules.map((mod: any, idx: number) => (
                <RuleModuleCard key={mod.module ?? idx} module={mod} type={version.type} />
              ))
            )}
          </div>
        ) : (
          <pre className="bg-muted rounded-md p-4 text-xs overflow-auto max-h-96 whitespace-pre-wrap font-mono">
            {JSON.stringify(version.rulesJson, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
