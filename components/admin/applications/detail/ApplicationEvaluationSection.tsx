import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, CheckCircle2, XCircle, AlertCircle, Target } from 'lucide-react';
import type { AdminApplicationEvaluation } from '@/modules/admin/admin-application-detail.service';

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
};

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function ApplicationEvaluationSection({ data }: Props) {
  const trace = data.evaluationTrace;

  return (
    <div className="space-y-4">
      {/* Estado del pipeline */}
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

      {/* Traza de evaluación */}
      {trace && (
        <>
          {/* Eliminatorias */}
          {trace.eliminatory && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" /> Validaciones eliminatorias
                  {trace.eliminatory.passed
                    ? <Badge variant="default" className="text-[10px]">Pasó</Badge>
                    : <Badge variant="destructive" className="text-[10px]">Falló</Badge>
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Módulos evaluados */}
                {trace.eliminatory.evaluatedModules && (
                  <div className="space-y-3">
                    {(trace.eliminatory.evaluatedModules as any[]).map((mod: any, idx: number) => (
                      <div key={idx} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium">{mod.label ?? mod.module}</span>
                          <span className="flex items-center gap-1 text-xs">
                            {mod.passed
                              ? <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Pasó</>
                              : <><XCircle className="h-3.5 w-3.5 text-red-500" /> Falló</>
                            }
                          </span>
                        </div>
                        {mod.rules && (mod.rules as any[]).length > 0 && (
                          <div className="space-y-1">
                            {(mod.rules as any[]).map((rule: any, rIdx: number) => (
                              <div key={rIdx} className="flex items-center justify-between text-xs pl-2 border-l-2 border-muted">
                                <span className="text-muted-foreground">{rule.label ?? rule.ruleId}</span>
                                {rule.passed === false
                                  ? <span className="text-red-500 font-medium">✗</span>
                                  : <span className="text-emerald-500">✓</span>
                                }
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Reglas fallidas */}
                {trace.eliminatory.failedRules && (trace.eliminatory.failedRules as any[]).length > 0 && (
                  <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
                    <p className="text-xs font-medium text-red-700 mb-2">Reglas que fallaron:</p>
                    {(trace.eliminatory.failedRules as any[]).map((rule: any, idx: number) => (
                      <p key={idx} className="text-xs text-red-600">• {rule.label ?? rule.ruleId}: {rule.reason ?? rule.message ?? '—'}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Scoring */}
          {trace.scoring && (
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
                    <p className="text-lg font-bold">{trace.scoring.baseScore ?? '—'}</p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-3 text-center">
                    <p className="text-[11px] text-muted-foreground">Score final</p>
                    <p className="text-lg font-bold text-primary">{trace.scoring.finalScore ?? '—'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-[11px] text-muted-foreground">Ajuste total</p>
                    <p className="text-lg font-bold">
                      {trace.scoring.totalPointsAdjustment != null
                        ? (trace.scoring.totalPointsAdjustment > 0 ? '+' : '') + trace.scoring.totalPointsAdjustment
                        : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-[11px] text-muted-foreground">Decisión</p>
                    <p className="text-sm font-bold">
                      {trace.scoring.decision === 'APPROVED'
                        ? <span className="text-emerald-600">Aprobado</span>
                        : trace.scoring.decision === 'REJECTED'
                        ? <span className="text-red-600">Rechazado</span>
                        : trace.scoring.decision ?? '—'}
                    </p>
                  </div>
                </div>

                {/* Thresholds */}
                {trace.scoring.thresholds && (
                  <div className="text-xs text-muted-foreground">
                    Umbral aprobación: {trace.scoring.thresholds.approvedMin ?? '—'} | Umbral revisión manual: {trace.scoring.thresholds.manualReviewMin ?? '—'}
                  </div>
                )}

                {/* Factores aplicados */}
                {trace.scoring.appliedFactors && (trace.scoring.appliedFactors as any[]).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Factores aplicados</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-1.5 font-medium text-muted-foreground">Factor</th>
                              <th className="text-right py-1.5 font-medium text-muted-foreground">Puntos</th>
                              <th className="text-left py-1.5 font-medium text-muted-foreground">Categoría</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(trace.scoring.appliedFactors as any[]).map((f: any, idx: number) => (
                              <tr key={idx} className="border-b last:border-0">
                                <td className="py-1.5">{f.label ?? f.ruleId ?? f.factor ?? '—'}</td>
                                <td className="py-1.5 text-right font-mono">
                                  <span className={f.points > 0 ? 'text-emerald-600' : f.points < 0 ? 'text-red-600' : ''}>
                                    {f.points > 0 ? '+' : ''}{f.points}
                                  </span>
                                </td>
                                <td className="py-1.5 text-muted-foreground">{f.category ?? f.module ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {/* Módulos de scoring */}
                {trace.scoring.modules && (trace.scoring.modules as any[]).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Módulos de scoring</p>
                      <div className="space-y-2">
                        {(trace.scoring.modules as any[]).map((mod: any, idx: number) => (
                          <div key={idx} className="rounded-lg border p-3">
                            <p className="text-xs font-medium mb-1">{mod.label ?? mod.module}</p>
                            {mod.rules && (mod.rules as any[]).map((r: any, rIdx: number) => (
                              <div key={rIdx} className="flex items-center justify-between text-xs pl-2 border-l-2 border-muted py-0.5">
                                <span className="text-muted-foreground">{r.label ?? r.ruleId}</span>
                                <span className={`font-mono ${r.triggered ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                  {r.triggered ? `${r.points > 0 ? '+' : ''}${r.points}` : '—'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Raw trace (fallback si no hay estructura conocida) */}
          {!trace.eliminatory && !trace.scoring && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Traza de evaluación (raw)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto max-h-96">
                  {JSON.stringify(trace, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Sin evaluación */}
      {!trace && !data.evaluationStep && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">La evaluación aún no se ha ejecutado</p>
        </div>
      )}
    </div>
  );
}
