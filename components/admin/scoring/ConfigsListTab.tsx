'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Play, Archive, RefreshCw, Loader2 } from 'lucide-react';
import type { ScorecardConfig } from '@/modules/admin/scoring';
import { activateExistingConfig } from '@/app/admin/scoring/actions';

interface Props {
  configs: ScorecardConfig[];
  onEdit: (config: ScorecardConfig) => void;
  onCreateNew: () => void;
  onRefresh: () => void;
}

export function ConfigsListTab({ configs, onEdit, onCreateNew, onRefresh }: Props) {
  const [activating, setActivating] = useState<string | null>(null);

  const handleActivate = async (id: string) => {
    setActivating(id);
    await activateExistingConfig(id);
    setActivating(null);
    onRefresh();
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Activa</Badge>;
      case 'DRAFT':
        return <Badge variant="outline" className="border-amber-300 text-amber-700">Borrador</Badge>;
      case 'ARCHIVED':
        return <Badge variant="secondary">Archivada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {configs.length} versión{configs.length !== 1 ? 'es' : ''} de configuración
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refrescar
          </Button>
          <Button size="sm" onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-1" /> Nueva versión
          </Button>
        </div>
      </div>

      {/* Lista de configs */}
      {configs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No hay configuraciones. Crea la primera versión.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {configs.map((config) => (
            <Card key={config.id} className={config.status === 'ACTIVE' ? 'border-green-300 bg-green-50/30' : ''}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base font-medium">
                      v{config.version} — {config.name}
                    </CardTitle>
                    {statusBadge(config.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    {config.status === 'DRAFT' && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => onEdit(config)}>
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleActivate(config.id)}
                          disabled={activating === config.id}
                        >
                          {activating === config.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Play className="h-4 w-4 mr-1" />
                          )}
                          Activar
                        </Button>
                      </>
                    )}
                    {config.status === 'ACTIVE' && (
                      <Button variant="outline" size="sm" onClick={() => onEdit(config)}>
                        Ver detalle
                      </Button>
                    )}
                    {config.status === 'ARCHIVED' && (
                      <Button variant="ghost" size="sm" onClick={() => onEdit(config)}>
                        <Archive className="h-4 w-4 mr-1" /> Ver
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-0">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{config.dimensions.length} dimensiones</span>
                  <span>•</span>
                  <span>Max score: {config.maxScore}</span>
                  <span>•</span>
                  <span>
                    {config.dimensions.reduce((sum, d) => sum + d.rules.length, 0)} reglas
                  </span>
                  {config.activatedAt && (
                    <>
                      <span>•</span>
                      <span>Activada: {new Date(config.activatedAt).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
                {config.description && (
                  <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
