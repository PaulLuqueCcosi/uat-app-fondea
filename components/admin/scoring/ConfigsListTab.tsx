'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Play, Copy, Eye, FileEdit, Loader2 } from 'lucide-react';
import type { ScorecardConfig } from '@/modules/admin/scoring';
import { activateExistingConfig } from '@/app/admin/scoring/actions';

interface Props {
  configs: ScorecardConfig[];
  onEdit: (config: ScorecardConfig) => void;
  onDuplicate: (config: ScorecardConfig) => void;
  onCreateNew: () => void;
  onRefresh: () => void;
}

export function ConfigsListTab({ configs, onEdit, onDuplicate, onCreateNew, onRefresh }: Props) {
  const [activating, setActivating] = useState<string | null>(null);

  const handleActivate = async (id: string) => {
    if (!confirm('¿Activar esta versión? La versión activa actual será archivada.')) return;
    setActivating(id);
    await activateExistingConfig(id);
    setActivating(null);
    onRefresh();
  };

  const activeConfig = configs.find(c => c.status === 'ACTIVE');

  if (configs.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No hay configuraciones. El sistema creará una por defecto al iniciar.
          </p>
          <Button onClick={onCreateNew} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva configuración
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {activeConfig && (
            <span>
              Versión activa: <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] ml-1">v{activeConfig.version}</Badge>
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {activeConfig && (
            <Button variant="outline" size="sm" onClick={() => onDuplicate(activeConfig)}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Duplicar activa
            </Button>
          )}
          <Button size="sm" onClick={onCreateNew}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nueva versión
          </Button>
        </div>
      </div>

      {/* Tabla de versiones */}
      <div className="rounded-xl border border-border/60 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 border-b border-border/60">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">Versión</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">Nombre</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">Estado</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">Dimensiones</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">Reglas</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">Fecha</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {configs.map((config) => {
              const totalRules = config.dimensions.reduce((sum, d) => sum + d.rules.length, 0);

              return (
                <tr
                  key={config.id}
                  className={`transition-colors ${
                    config.status === 'ACTIVE'
                      ? 'bg-green-50/40 hover:bg-green-50/70'
                      : 'bg-white hover:bg-muted/30'
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                      v{config.version}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-sm font-medium">{config.name}</span>
                      {config.description && (
                        <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{config.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {config.status === 'ACTIVE' && (
                      <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">Activa</Badge>
                    )}
                    {config.status === 'DRAFT' && (
                      <Badge variant="outline" className="border-amber-300 text-amber-700 text-[10px]">Borrador</Badge>
                    )}
                    {config.status === 'ARCHIVED' && (
                      <Badge variant="secondary" className="text-[10px]">Archivada</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {config.dimensions.length}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {totalRules}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {config.activatedAt ? formatDate(config.activatedAt) : formatDate(config.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      {config.status === 'DRAFT' && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(config)} title="Editar">
                            <FileEdit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(config)} title="Duplicar">
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-green-600 hover:text-green-700"
                            onClick={() => handleActivate(config.id)}
                            disabled={activating === config.id}
                            title="Activar"
                          >
                            {activating === config.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </>
                      )}
                      {config.status === 'ACTIVE' && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(config)} title="Ver detalle">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(config)} title="Duplicar para editar">
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {config.status === 'ARCHIVED' && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(config)} title="Ver">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(config)} title="Duplicar">
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
