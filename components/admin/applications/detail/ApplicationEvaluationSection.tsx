import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, CheckCircle2, XCircle, Target, Info, ShieldCheck, ShieldAlert } from 'lucide-react';
import type {
  AdminApplicationEvaluation,
  EvaluationSnapshotItem,
  EvaluationModuleTrace,
  EvaluationRuleTrace,
} from '@/modules/admin/admin-application-detail.service';

interface Props {
  data: AdminApplicationEvaluation;
}

const STEP_LABELS: Record<string, string> = {
  VALIDATION_DISPATCHED: 'Validación enviada',
  VALIDATION_COMPLETED: 'Validación completada',
  VALIDATION_FAILED: 'Validación fallida',
  SCORING_DISPATCHED: 'Scoring enviado',
  SCORING_COMPLETED: 'Scoring completado',
  SCORING_FAILED: 'Scoring fallido',
  COMPLETED: 'Completado',
  CALCULATION_COMPLETED: 'Cálculo completado',
  CALCULATION_FAILED: 'Cálculo fallido',
  CONTRACT_GENERATION_DISPATCHED: 'Contrato en proceso',
  CONTRACT_GENERATED: 'Contrato generado',
  CONTRACT_GENERATION_FAILED: 'Contrato falló',
  PRE_APPROVED: 'Pre-aprobada',
  SUBMITTED: 'Enviada',
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatVariableValue(value: any): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'number') {
    if (value >= 100 && Number.isFinite(value)) return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
    if (value < 1 && value > 0) return `${(value * 100).toFixed(1)}%`;
    return value.toLocaleString('es-PE', { maximumFractionDigits: 2 });
  }
  return String(value);
}

export function ApplicationEvaluationSection({ data }: Props) {
  return (
    <div className="space-y-4">
      {/* Estado del pipeline (siempre visible) */}
      <PipelineStateCard data={data} />

      {/* Snapshot de evaluación (trazabilidad completa) */}
      {data.evaluations && data.evaluations.length > 0 ? (
        <SnapshotEvaluationView snapshot={data.evaluations[0]} />
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">La evaluación aún no se ha ejecutado</p>
        </div>
      )}
    </div>
  );
}

// ─── Pipeline State Card ────────────────────────────────────────────────────

function PipelineStateCard({ data }: { data: AdminApplicationEvaluation }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4" /> Estado del pipeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-[11px] text-muted-foreground">Paso actual</p>
            <p className="text-sm font-medium">{data.evaluationStep ? STEP_LABELS[data.evaluationStep] ?? data.evaluationStep : '—'}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Evaluado</p>
            <p className="text-sm font-medium">{formatDateTime(data.evaluatedAt)}</p>
          </div>
          {data.failureCode && (
            <div>
              <p className="text-[11px] text-muted-foreground">Código fallo</p>
              <p className="text-sm font-mono text-red-600">{data.failureCode}</p>
            </div>
          )}
          {data.rejectionReason && (
            <div>
              <p className="text-[11px] text-muted-foreground">Razón rechazo</p>
              <p className="text-sm text-red-600">{data.rejectionReason}</p>
            </div>
          )}
        </div>
        {data.evaluationError && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-xs text-red-700">{data.evaluationError}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Snapshot Evaluation View (nueva, completa) ─────────────────────────────

function SnapshotEvaluationView({ snapshot }: { snapshot: EvaluationSnapshotItem }) {
  const trace = snapshot.trace;
  if (!trace) return null;

  return (
    <>
      {/* Resumen de decisión */}
      <DecisionSummaryCard snapshot={snapshot} />

      {/* Eliminatorias */}
      {trace.eliminatory && (
        <EliminatoryCard eliminatory={trace.eliminatory} />
      )}

      {/* Scoring */}
      {trace.scoring && (
        <ScoringCard scoring={trace.scoring} />
      )}

      {/* Versiones */}
      {trace.versions && (
        <VersionsCard versions={trace.versions} />
      )}
    </>
  );
}

// ─── Decision Summary ───────────────────────────────────────────────────────

function DecisionSummaryCard({ snapshot }: { snapshot: EvaluationSnapshotItem }) {
  const isApproved = snapshot.decision === 'APPROVED';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {isApproved
            ? <ShieldCheck className="h-4 w-4 text-emerald-600" />
            : <ShieldAlert className="h-4 w-4 text-red-600" />
          }
          Resultado de evaluación
          <Badge variant={isApproved ? 'default' : 'destructive'} className="text-[10px] ml-auto">
            {isApproved ? 'APROBADA' : 'RECHAZADA'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-[11px] text-muted-foreground">Decisión</p>
            <p className={`text-sm font-bold ${isApproved ? 'text-emerald-600' : 'text-red-600'}`}>
              {isApproved ? 'Aprobada' : 'Rechazada'}
            </p>
          </div>
          {snapshot.baseScore != null && (
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">Score base</p>
              <p className="text-lg font-bold">{snapshot.baseScore}</p>
            </div>
          )}
          {snapshot.finalScore != null && (
            <div className="rounded-lg bg-primary/10 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">Score final</p>
              <p className="text-lg font-bold text-primary">{snapshot.finalScore}</p>
            </div>
          )}
          {snapshot.approvedMin != null && (
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">Mínimo aprobación</p>
              <p className="text-lg font-bold">{snapshot.approvedMin}</p>
            </div>
          )}
          {snapshot.failedModule && (
            <div className="rounded-lg bg-red-50 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">Módulo que falló</p>
              <p className="text-sm font-bold text-red-600">{snapshot.failedModule}</p>
            </div>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">
          Evaluado: {formatDateTime(snapshot.evaluatedAt)}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Eliminatory Card ───────────────────────────────────────────────────────

function EliminatoryCard({ eliminatory }: { eliminatory: NonNullable<EvaluationSnapshotItem['trace']>['eliminatory'] }) {
  if (!eliminatory) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4" /> Reglas eliminatorias
          {eliminatory.passed
            ? <Badge variant="default" className="text-[10px]">Todas pasaron</Badge>
            : <Badge variant="destructive" className="text-[10px]">Falló en: {eliminatory.failedModule}</Badge>
          }
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {eliminatory.modules.map((mod, idx) => (
          <EliminatoryModuleRow key={idx} module={mod} />
        ))}
      </CardContent>
    </Card>
  );
}

function EliminatoryModuleRow({ module }: { module: EvaluationModuleTrace }) {
  const passed = module.passed !== false;

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium">{module.label ?? module.module}</span>
        <span className="flex items-center gap-1 text-xs">
          {passed
            ? <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Pasó</>
            : <><XCircle className="h-3.5 w-3.5 text-red-500" /> Falló</>
          }
        </span>
      </div>
      <div className="space-y-1.5">
        {module.rules.map((rule, rIdx) => (
          <EliminatoryRuleRow key={rIdx} rule={rule} />
        ))}
      </div>
    </div>
  );
}

function EliminatoryRuleRow({ rule }: { rule: EvaluationRuleTrace }) {
  const passed = rule.passed !== false;
  const variables = rule.variables ?? {};
  const varEntries = Object.entries(variables);

  return (
    <div className={`flex items-start justify-between text-xs pl-2 py-1 border-l-2 ${passed ? 'border-emerald-200' : 'border-red-300 bg-red-50/50 rounded-r'}`}>
      <div className="flex-1">
        <span className={passed ? 'text-muted-foreground' : 'text-red-700 font-medium'}>
          {rule.label ?? rule.ruleId}
        </span>
        {varEntries.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
            {varEntries.map(([path, value]) => (
              <span key={path} className="text-[11px] text-muted-foreground font-mono">
                {path.split('.').pop()}: <span className="font-semibold text-foreground">{formatVariableValue(value)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      <span className="ml-2 shrink-0">
        {passed
          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          : <XCircle className="h-3.5 w-3.5 text-red-500" />
        }
      </span>
    </div>
  );
}

// ─── Scoring Card ───────────────────────────────────────────────────────────

function ScoringCard({ scoring }: { scoring: NonNullable<EvaluationSnapshotItem['trace']>['scoring'] }) {
  if (!scoring) return null;

  const totalAdjustment = scoring.appliedFactors.reduce((sum, f) => sum + f.points, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4" /> Scoring crediticio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-[11px] text-muted-foreground">Score base</p>
            <p className="text-lg font-bold">{scoring.baseScore}</p>
          </div>
          <div className="rounded-lg bg-primary/10 p-3 text-center">
            <p className="text-[11px] text-muted-foreground">Score final</p>
            <p className="text-lg font-bold text-primary">{scoring.finalScore}/100</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-[11px] text-muted-foreground">Ajuste total</p>
            <p className={`text-lg font-bold ${totalAdjustment > 0 ? 'text-emerald-600' : totalAdjustment < 0 ? 'text-red-600' : ''}`}>
              {totalAdjustment > 0 ? '+' : ''}{totalAdjustment}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-[11px] text-muted-foreground">Umbral</p>
            <p className="text-lg font-bold">≥ {scoring.approvedMin}</p>
          </div>
        </div>

        {/* Barra visual del score */}
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all ${scoring.finalScore >= scoring.approvedMin ? 'bg-emerald-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(100, scoring.finalScore)}%` }}
          />
          <div
            className="absolute inset-y-0 w-0.5 bg-foreground/60"
            style={{ left: `${Math.min(100, scoring.approvedMin)}%` }}
            title={`Mínimo: ${scoring.approvedMin}`}
          />
        </div>

        <Separator />

        {/* Módulos con detalle de cada regla */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Detalle por módulo</p>
          <div className="space-y-3">
            {scoring.modules.map((mod, idx) => (
              <ScoringModuleRow key={idx} module={mod} />
            ))}
          </div>
        </div>

        {/* Factores aplicados (resumen) */}
        {scoring.appliedFactors.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Factores que sumaron/restaron</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1.5 font-medium text-muted-foreground">Factor</th>
                      <th className="text-right py-1.5 font-medium text-muted-foreground">Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoring.appliedFactors.map((f, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-1.5">{f.label ?? f.ruleId}</td>
                        <td className="py-1.5 text-right font-mono">
                          <span className={f.points > 0 ? 'text-emerald-600' : 'text-red-600'}>
                            {f.points > 0 ? '+' : ''}{f.points}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ScoringModuleRow({ module }: { module: EvaluationModuleTrace }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs font-medium mb-2">{module.label ?? module.module}</p>
      <div className="space-y-1.5">
        {module.rules.map((rule, rIdx) => (
          <ScoringRuleRow key={rIdx} rule={rule} />
        ))}
      </div>
    </div>
  );
}

function ScoringRuleRow({ rule }: { rule: EvaluationRuleTrace }) {
  const triggered = rule.triggered === true;
  const variables = rule.variables ?? {};
  const varEntries = Object.entries(variables);

  return (
    <div className={`flex items-start justify-between text-xs pl-2 py-1 border-l-2 ${triggered ? 'border-primary/50 bg-primary/5 rounded-r' : 'border-muted'}`}>
      <div className="flex-1">
        <span className={triggered ? 'text-foreground font-medium' : 'text-muted-foreground'}>
          {rule.label ?? rule.ruleId}
        </span>
        {varEntries.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
            {varEntries.map(([path, value]) => (
              <span key={path} className="text-[11px] text-muted-foreground font-mono">
                {path.split('.').pop()}: <span className="font-semibold text-foreground">{formatVariableValue(value)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      <span className={`ml-2 shrink-0 font-mono text-xs ${triggered ? (rule.points! > 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold') : 'text-muted-foreground'}`}>
        {triggered ? `${rule.points! > 0 ? '+' : ''}${rule.points}` : '—'}
      </span>
    </div>
  );
}

// ─── Versions Card ──────────────────────────────────────────────────────────

function VersionsCard({ versions }: { versions: NonNullable<EvaluationSnapshotItem['trace']>['versions'] }) {
  if (!versions) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Info className="h-4 w-4" /> Configuración usada
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Reglas eliminatorias</p>
            <p className="font-medium">{versions.eliminatory.version}</p>
            <Badge variant="outline" className="text-[9px] mt-1">{versions.eliminatory.source}</Badge>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Reglas de scoring</p>
            <p className="font-medium">{versions.scoring.version}</p>
            <Badge variant="outline" className="text-[9px] mt-1">{versions.scoring.source}</Badge>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Umbrales</p>
            <p className="font-medium">{versions.thresholds.version}</p>
            <Badge variant="outline" className="text-[9px] mt-1">{versions.thresholds.source}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
