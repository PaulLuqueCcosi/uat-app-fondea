'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Plus, Save, Loader2, AlertCircle, CheckCircle2, History, Eye,
} from 'lucide-react';
import {
  getActivePenaltyConfigAction,
  createPenaltyConfigAction,
  getPenaltyConfigHistoryAction,
  getConceptsCatalogAction,
} from '@/app/actions/admin-penalty.actions';
import type {
  ConceptsCatalog,
  PenaltyConfigResponse,
} from '@/modules/admin/admin-penalty.types';
import { conceptLabel } from '@/modules/shared/charge-concepts';
import { PenaltyStagesTable } from './penalty/PenaltyStagesTable';
import { PenaltyMatrixEditor } from './penalty/PenaltyMatrixEditor';
import { PenaltySimulatorPanel, type SimulationSource } from './penalty/PenaltySimulatorPanel';
import { penaltyErrorMessage } from './penalty/penalty-errors';
import {
  defaultMatrixDraft,
  draftFromConfig,
  normalizeAllocationOrder,
  requestFromDraft,
  validateMatrix,
  type MatrixDraft,
  type MatrixError,
} from './penalty/penalty-matrix';
import { formatDateTimePeru } from '@/modules/shared/backend-date';

// ── Main Component ────────────────────────────────────────────────────────────

export function PenaltyConfigPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [config, setConfig] = useState<PenaltyConfigResponse | null>(null);
  const [history, setHistory] = useState<PenaltyConfigResponse[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [configName, setConfigName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<ConceptsCatalog | null>(null);
  const [matrixDraft, setMatrixDraft] = useState<MatrixDraft>(() => defaultMatrixDraft(null));
  const [matrixErrors, setMatrixErrors] = useState<MatrixError[]>([]);

  useEffect(() => { loadConfig(); }, []);

  async function loadConfig() {
    setLoading(true);
    const [active, hist, concepts] = await Promise.all([
      getActivePenaltyConfigAction(),
      getPenaltyConfigHistoryAction(),
      getConceptsCatalogAction(),
    ]);
    setConfig(active);
    setHistory(hist);
    setCatalog(concepts);
    setLoading(false);
  }

  function startEditing() {
    setMatrixDraft(draftFromConfig(config, catalog));
    setMatrixErrors([]);
    setConfigName('');
    setMessage(null);
    setIsEditing(true);
  }

  function handleSave() {
    const validationErrors = validateMatrix(matrixDraft, catalog);
    setMatrixErrors(validationErrors);
    if (validationErrors.length > 0) {
      setMessage({ type: 'error', text: `Hay ${validationErrors.length} error(es) de validación` });
      return;
    }

    const name = configName.trim() || `Config Mora — ${new Date().toLocaleDateString('es-PE')}`;

    startTransition(async () => {
      const result = await createPenaltyConfigAction(requestFromDraft(name, matrixDraft));

      if (result.ok) {
        setMessage({ type: 'success', text: 'Configuración guardada y activada' });
        setIsEditing(false);
        await loadConfig();
        router.refresh();
      } else {
        setMessage({ type: 'error', text: penaltyErrorMessage(result.error, 'Error al guardar') });
      }
    });
  }

  /** Configuración a simular: el borrador si es válido; si no, el motivo por el que no se puede. */
  function editingSimulationSource(): SimulationSource {
    if (validateMatrix(matrixDraft, catalog).length > 0) {
      return { kind: 'unavailable', reason: 'Corrige los errores de la matriz para poder simularla.' };
    }
    return { kind: 'draft', config: requestFromDraft(configName.trim() || 'Simulación', matrixDraft) };
  }

  function savedSimulationSource(): SimulationSource {
    if (config && config.id) return { kind: 'saved', configId: config.id };
    return { kind: 'unavailable', reason: 'Guarda una configuración para poder simularla.' };
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Editing Mode ────────────────────────────────────────────────────────────

  if (isEditing) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Nueva configuración de mora</CardTitle>
                <CardDescription>
                  Define tramos de días consecutivos y, para cada uno, cómo se cobra cada concepto.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setMatrixErrors([]); setMessage(null); }}>
                Cancelar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nombre */}
            <div className="space-y-1.5 max-w-md">
              <Label className="text-sm font-medium">Nombre de la configuración</Label>
              <Input
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                placeholder={`Config Mora — ${new Date().toLocaleDateString('es-PE')}`}
                className="h-9"
              />
              <p className="text-[10px] text-muted-foreground">Identificador para el historial. Opcional.</p>
            </div>

            <Separator />

            {catalog ? (
              <PenaltyMatrixEditor
                draft={matrixDraft}
                onChange={(next) => { setMatrixDraft(next); setMatrixErrors([]); }}
                catalog={catalog}
                errors={matrixErrors}
              />
            ) : (
              <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm text-destructive">
                    No se pudieron cargar las reglas de los conceptos, así que la matriz no se puede editar ahora.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => loadConfig().then(() => setIsEditing(true))}>
                    Reintentar
                  </Button>
                </div>
              </div>
            )}

            {/* Errores de la matriz */}
            {matrixErrors.length > 0 && (
              <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Corrige los errores antes de guardar</p>
                  <ul className="mt-1 space-y-0.5">
                    {matrixErrors.slice(0, 8).map((e, i) => (
                      <li key={i} className="text-xs text-destructive/80">
                        Tramo {e.stageIndex + 1}: {e.message}
                      </li>
                    ))}
                    {matrixErrors.length > 8 && (
                      <li className="text-xs text-destructive/80">...y {matrixErrors.length - 8} más</li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* Mensaje de error al guardar (por ejemplo, un código del backend) */}
            {message?.type === 'error' && matrixErrors.length === 0 && (
              <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{message.text}</p>
              </div>
            )}

            {/* Feedback success */}
            {message?.type === 'success' && (
              <div className="rounded-lg border border-success-200 bg-success-50 p-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success-600" />
                <p className="text-sm text-success-700">{message.text}</p>
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Al guardar, esta config se activa inmediatamente. Los créditos existentes no se ven afectados.
              </p>
              <Button className="gap-1.5" onClick={handleSave} disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar y activar
              </Button>
            </div>
          </CardContent>
        </Card>

        {catalog && (
          <PenaltySimulatorPanel
            source={editingSimulationSource()}
            configName={`${configName.trim() || 'Simulación'} (en edición, sin guardar)`}
            includeIgv={matrixDraft.includeIgv}
          />
        )}
      </div>
    );
  }

  // ── Read Mode ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Config activa */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Configuración activa</CardTitle>
              <CardDescription>
                {config ? config.name : 'No hay configuración activa'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="gap-1.5" onClick={startEditing}>
                <Save className="h-3.5 w-3.5" />
                {config ? 'Nueva configuración' : 'Crear configuración'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {config ? (
            <div className="space-y-4">
              <PenaltyStagesTable stages={config.stages} catalog={catalog} />
              <p className="text-xs text-muted-foreground">
                Orden de imputación del pago:{' '}
                <span className="font-medium text-foreground">
                  {normalizeAllocationOrder(config.allocationOrder)
                    .map((c) => conceptLabel(c, catalog?.concepts.find((x) => x.code === c)?.label))
                    .join(' → ')}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Base de cálculo:{' '}
                <span className="font-medium text-foreground">
                  {config.includeIgv ? 'monto de la cuota con IGV' : 'monto de la cuota sin IGV'}
                </span>
              </p>
              <p className="text-[10px] text-muted-foreground">
                Creada: {formatDateTimePeru(config.createdAt)} · Por: {config.createdBy}
              </p>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                No hay configuración de mora activa. Los créditos nuevos no tendrán penalidad hasta que configures una.
              </p>
              <Button size="sm" onClick={startEditing} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Crear primera configuración
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {config && (
        <PenaltySimulatorPanel source={savedSimulationSource()} configName={config?.name ? `${config.name} (activa)` : undefined} includeIgv={config?.includeIgv ?? false} />
      )}

      {/* Historial */}
      {history.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Historial de configuraciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.map((h) => (
              <HistoryItem key={h.id} item={h} catalog={catalog} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── History Item with expandable detail ───────────────────────────────────────

function HistoryItem({ item, catalog }: { item: PenaltyConfigResponse; catalog: ConceptsCatalog | null }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b last:border-0 py-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{item.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {formatDateTimePeru(item.createdAt)} ·{' '}
            {item.stages.length} tramos por conceptos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={item.isActive ? 'success' : 'secondary'} className="text-[10px]">
            {item.isActive ? 'Activa' : 'Inactiva'}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Ocultar' : 'Ver'} el detalle de ${item.name}`}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-2">
          <PenaltyStagesTable stages={item.stages} catalog={catalog} compact />
        </div>
      )}
    </div>
  );
}
