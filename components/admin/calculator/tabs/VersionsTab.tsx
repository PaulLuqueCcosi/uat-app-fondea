'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Play, Copy, Eye, FileEdit, Loader2 } from 'lucide-react';
import {
  getVersionsAction,
  getVersionByIdAction,
  activateVersionAction,
  duplicateVersionAction,
} from '@/app/actions/calculator-admin.actions';
import { toast } from 'sonner';
import type { ConfigType, ConfigVersion } from '@/modules/admin/calculator-admin.service';
import { VersionEditorModal } from '../VersionEditorModal';

interface VersionsTabProps {
  configType: ConfigType;
  activeVersion: ConfigVersion | null;
}

const TYPE_LABELS: Record<ConfigType, string> = {
  AVAILABILITY: 'Disponibilidad',
  FEE_GROUPS: 'Tarifas',
  PRICING_RULES: 'Reglas de Pricing',
};

export function VersionsTab({ configType, activeVersion }: VersionsTabProps) {
  const [versions, setVersions] = useState<ConfigVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  // Editor modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<ConfigVersion | null>(null);
  const [editorMode, setEditorMode] = useState<'view' | 'edit' | 'create'>('view');

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    const result = await getVersionsAction(configType);
    setVersions(result);
    setLoading(false);
  }, [configType]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleActivate = async (id: string) => {
    if (!confirm('¿Activar esta versión? La versión activa actual será archivada.')) return;
    setActivating(id);
    const result = await activateVersionAction(configType, id);
    if (result.ok) {
      toast.success('Versión activada');
      fetchVersions();
    } else {
      toast.error(result.error ?? 'Error al activar');
    }
    setActivating(null);
  };

  const handleDuplicate = async (id: string) => {
    setDuplicating(id);
    const result = await duplicateVersionAction(configType, id);
    if (result.ok) {
      toast.success('Versión duplicada como DRAFT');
      fetchVersions();
    } else {
      toast.error(result.error ?? 'Error al duplicar');
    }
    setDuplicating(null);
  };

  const handleView = async (version: ConfigVersion) => {
    // Cargar data completa si no la tiene
    if (!version.data) {
      const full = await getVersionByIdAction(configType, version.id);
      if (full) {
        setEditingVersion(full);
      }
    } else {
      setEditingVersion(version);
    }
    setEditorMode('view');
    setEditorOpen(true);
  };

  const handleEdit = async (version: ConfigVersion) => {
    if (!version.data) {
      const full = await getVersionByIdAction(configType, version.id);
      if (full) setEditingVersion(full);
    } else {
      setEditingVersion(version);
    }
    setEditorMode('edit');
    setEditorOpen(true);
  };

  const handleCreateNew = () => {
    setEditingVersion(null);
    setEditorMode('create');
    setEditorOpen(true);
  };

  const handleEditorClose = () => {
    setEditorOpen(false);
    setEditingVersion(null);
  };

  const handleEditorSaved = () => {
    setEditorOpen(false);
    setEditingVersion(null);
    fetchVersions();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-32 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No hay versiones de {TYPE_LABELS[configType]}. Crea la primera.
          </p>
          <Button onClick={handleCreateNew} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva versión
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {activeVersion && (
            <span>
              Versión activa: <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] ml-1">v{activeVersion.version}</Badge>
              {activeVersion.name && <span className="ml-1.5">— {activeVersion.name}</span>}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {activeVersion && (
            <Button variant="outline" size="sm" onClick={() => handleDuplicate(activeVersion.id)}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Duplicar activa
            </Button>
          )}
          <Button size="sm" onClick={handleCreateNew}>
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
              <th className="text-left px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">Fecha</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">Creado por</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {versions.map((version) => (
              <tr
                key={version.id}
                className={`transition-colors ${
                  version.status === 'ACTIVE'
                    ? 'bg-green-50/40 hover:bg-green-50/70'
                    : 'bg-white hover:bg-muted/30'
                }`}
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                    v{version.version}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <span className="text-sm font-medium">{version.name ?? '—'}</span>
                    {version.description && (
                      <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{version.description}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {version.status === 'ACTIVE' && (
                    <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">Activa</Badge>
                  )}
                  {version.status === 'DRAFT' && (
                    <Badge variant="outline" className="border-amber-300 text-amber-700 text-[10px]">Borrador</Badge>
                  )}
                  {version.status === 'ARCHIVED' && (
                    <Badge variant="secondary" className="text-[10px]">Archivada</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {version.activatedAt ? formatDate(version.activatedAt) : formatDate(version.createdAt)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {version.createdBy ?? '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-0.5">
                    {version.status === 'DRAFT' && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(version)} title="Editar">
                          <FileEdit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(version.id)} title="Duplicar">
                          {duplicating === version.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-green-600 hover:text-green-700"
                          onClick={() => handleActivate(version.id)}
                          disabled={activating === version.id}
                          title="Activar"
                        >
                          {activating === version.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </>
                    )}
                    {version.status === 'ACTIVE' && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleView(version)} title="Ver detalle">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(version.id)} title="Duplicar para editar">
                          {duplicating === version.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </>
                    )}
                    {version.status === 'ARCHIVED' && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleView(version)} title="Ver">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(version.id)} title="Duplicar">
                          {duplicating === version.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Editor Modal */}
      {editorOpen && (
        <VersionEditorModal
          configType={configType}
          version={editingVersion}
          mode={editorMode}
          onClose={handleEditorClose}
          onSaved={handleEditorSaved}
        />
      )}
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
