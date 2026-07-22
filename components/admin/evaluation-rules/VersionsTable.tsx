'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Copy, Pause, Play, Plus } from 'lucide-react';
import type { RuleSetVersionResponse } from '@/modules/admin/admin-evaluation-rules.service';

interface VersionsTableProps {
  versions: RuleSetVersionResponse[];
  selectedId: string | null;
  onSelect: (v: RuleSetVersionResponse) => void;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
  onCreateNew: () => void;
  onDuplicate: (v: RuleSetVersionResponse) => void;
}

export function VersionsTable({
  versions,
  selectedId,
  onSelect,
  onActivate,
  onDeactivate,
  onCreateNew,
  onDuplicate,
}: VersionsTableProps) {
  if (versions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No hay versiones configuradas. Crea la primera para empezar.
          </p>
          <Button onClick={onCreateNew} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva Versión
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={onCreateNew} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Nueva Versión
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 border-b border-border/60">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">Versión</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">Descripción</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">Estado</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">Fecha</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {versions.map((v) => (
              <tr
                key={v.id}
                className={`transition-colors cursor-pointer ${
                  selectedId === v.id ? 'bg-primary/5 border-l-2 border-l-primary' : 
                  v.active ? 'bg-green-50/40 hover:bg-green-50/70' :
                  'bg-white hover:bg-muted/30'
                }`}
                onClick={() => onSelect(v)}
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                    v{v.version}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">
                  {v.description ?? '—'}
                </td>
                <td className="px-4 py-3">
                  {v.active ? (
                    <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                      Activa
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Inactiva</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {formatDate(v.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSelect(v)} title="Ver reglas">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(v)} title="Duplicar">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {v.active ? (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-orange-600 hover:text-orange-700" onClick={() => onDeactivate(v.id)} title="Desactivar">
                        <Pause className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700" onClick={() => onActivate(v.id)} title="Activar">
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
