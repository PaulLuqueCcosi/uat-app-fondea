'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Play, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  listThresholdsAction,
  createThresholdsAction,
  activateThresholdsAction,
} from '@/app/actions/admin-evaluation-rules.actions';
import type { ScoringThresholdsResponse } from '@/modules/admin/admin-evaluation-rules.service';

export function ThresholdsPanel() {
  const [thresholds, setThresholds] = useState<ScoringThresholdsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  // Form
  const [baseScore, setBaseScore] = useState('50');
  const [approvedMin, setApprovedMin] = useState('60');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThresholds = useCallback(async () => {
    setLoading(true);
    const res = await listThresholdsAction();
    if (res.ok && res.data) {
      setThresholds(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchThresholds(); }, [fetchThresholds]);

  const handleCreate = async () => {
    setError(null);
    const approved = Number(approvedMin);
    const base = Number(baseScore);

    if (approved < 1 || approved > 100) {
      setError('El score mínimo para aprobar debe estar entre 1 y 100.');
      return;
    }

    setCreating(true);
    const res = await createThresholdsAction({
      baseScore: base,
      approvedMin: approved,
      description: description.trim() || undefined,
    });

    if (res.ok) {
      setCreateOpen(false);
      setDescription('');
      await fetchThresholds();
    } else {
      setError(res.error ?? 'Error al crear');
    }
    setCreating(false);
  };

  const handleActivate = async (id: string) => {
    const res = await activateThresholdsAction(id);
    if (res.ok) {
      await fetchThresholds();
    }
  };

  const active = thresholds.find(t => t.active);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active config */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {active ? (
            <>
              <div className="rounded-lg border px-4 py-2 text-center">
                <p className="text-[10px] text-muted-foreground">Score Base</p>
                <p className="text-lg font-bold">{active.baseScore}</p>
              </div>
              <div className="rounded-lg border px-4 py-2 text-center bg-green-50">
                <p className="text-[10px] text-green-700">Mínimo para Aprobar</p>
                <p className="text-lg font-bold text-green-700">≥ {active.approvedMin}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                Score &lt; {active.approvedMin} → <span className="text-red-600 font-medium">Rechazado</span>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Sin umbrales configurados. Usando defaults: base=50, aprobar≥60.
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Nuevo umbral
        </Button>
      </div>

      {/* History table */}
      {thresholds.length > 0 && (
        <>
          <Separator />
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2">Score Base</th>
                  <th className="text-left px-3 py-2">Mín. Aprobar</th>
                  <th className="text-left px-3 py-2">Estado</th>
                  <th className="text-left px-3 py-2">Fecha</th>
                  <th className="text-left px-3 py-2">Nota</th>
                  <th className="text-right px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {thresholds.map(t => (
                  <tr key={t.id} className={t.active ? 'bg-green-50/50' : ''}>
                    <td className="px-3 py-2 font-mono">{t.baseScore}</td>
                    <td className="px-3 py-2 font-mono font-medium text-green-700">≥{t.approvedMin}</td>
                    <td className="px-3 py-2">
                      {t.active
                        ? <Badge className="bg-green-50 text-green-700 border-green-200 text-[9px]">Activo</Badge>
                        : <Badge variant="secondary" className="text-[9px]">Inactivo</Badge>}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDate(t.createdAt)}</td>
                    <td className="px-3 py-2 text-muted-foreground truncate max-w-[150px]">{t.description ?? '—'}</td>
                    <td className="px-3 py-2 text-right">
                      {!t.active && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600" onClick={() => handleActivate(t.id)} title="Activar">
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo umbral de aprobación</DialogTitle>
            <DialogDescription>
              Se crea inactivo. Actívalo cuando estés seguro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Score base</Label>
                <Input type="number" value={baseScore} onChange={(e) => setBaseScore(e.target.value)} className="h-8" />
                <p className="text-[10px] text-muted-foreground">Punto de partida neutro</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mínimo para aprobar</Label>
                <Input type="number" value={approvedMin} onChange={(e) => setApprovedMin(e.target.value)} className="h-8" />
                <p className="text-[10px] text-muted-foreground">Score ≥ este valor = aprobado</p>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Nota (por qué se cambia)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-8"
                placeholder="Ej: Bajamos a 55 por alto volumen de rechazos"
              />
            </div>

            <div className="text-[10px] text-muted-foreground bg-muted/50 rounded p-2">
              Score ≥ {approvedMin} → <span className="text-green-700 font-medium">Aprobado</span> |
              Score &lt; {approvedMin} → <span className="text-red-700 font-medium">Rechazado</span>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Crear umbral
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
