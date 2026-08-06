'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Brain, AlertTriangle, Wallet, Briefcase, Home, TrendingUp, CheckCircle2, Layers, Info, Wallet2,
} from 'lucide-react';
import type { ScoreEvaluation, DimensionResult } from '@/modules/admin';
import type { ScoreRange } from '@/modules/admin/calculator-admin.service';
export { formatDate, formatDateTime } from './score-format';

/** Cruce del score contra los rangos de la "Disponibilidad" activa del pricing
 * (calculadora — servicio aparte, ver modules/admin/calculator-admin.service.ts).
 * `range` es null si no hay config de disponibilidad activa, o si sus rangos
 * no cubren este score (hueco de configuración). */
export interface AvailabilityMatch {
  range: ScoreRange | null;
  configId: string;
  configVersion: number;
}

export const SCORE_LEVEL_VARIANT: Record<string, 'success' | 'warning' | 'error'> = {
  EXCELENTE: 'success',
  BUENO: 'success',
  REGULAR: 'warning',
  BAJO: 'warning',
  MUY_BAJO: 'error',
};

export const TRIGGER_LABEL: Record<string, string> = {
  APPLICATION_APPROVED: 'Solicitud aprobada',
  CREDIT_DISBURSED: 'Crédito desembolsado',
  PAYMENT_RECEIVED: 'Pago recibido',
  PAYMENT_OVERDUE: 'Cuota vencida',
  BURO_UPDATED: 'Buró actualizado',
  ADMIN_REQUEST: 'Recálculo manual',
  PROFILE_UPDATED: 'Perfil actualizado',
  SCHEDULED: 'Programado',
};

const DIMENSION_ICON: Record<string, typeof Wallet> = {
  CAPACIDAD_PAGO: Wallet,
  ESTABILIDAD_LABORAL: Briefcase,
  PERFIL_PATRIMONIAL: Home,
  COMPORTAMIENTO_CREDITICIO: TrendingUp,
  COHERENCIA_DATOS: CheckCircle2,
};

/** El catálogo de nombres bonitos vive en el backend (ScorecardMetadata) —
 * acá solo mostramos el snapshot crudo de forma legible: "monthlyIncome" → "Monthly Income". */
function prettifyKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

function formatSnapshotValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(4);
  return String(v);
}

interface Props {
  evaluation: ScoreEvaluation;
  /** Ya formateada por el Server Component que llama a este componente —
   * ver comentario en score-format.ts sobre por qué no se formatea acá. */
  createdAtDisplay: string;
  availabilityMatch?: AvailabilityMatch | null;
}

export function EvaluationBreakdown({ evaluation, createdAtDisplay, availabilityMatch }: Props) {
  const snapshot = useMemo(() => {
    try {
      const parsed = JSON.parse(evaluation.inputSnapshot) as Record<string, unknown>;
      return Object.entries(parsed).filter(([, v]) => v !== null && v !== undefined);
    } catch {
      return null;
    }
  }, [evaluation.inputSnapshot]);

  const delta = evaluation.scoreDelta;
  const deltaPositive = delta >= 0;

  return (
    <div className="space-y-4">
      {/* Resumen del resultado */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" /> Resultado de la evaluación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-primary/10 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">Score</p>
              <p className="text-2xl font-bold text-primary">{evaluation.totalScore}</p>
            </div>
            {evaluation.previousScore != null && (
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-[11px] text-muted-foreground">Score anterior</p>
                <p className="text-2xl font-bold">{evaluation.previousScore}</p>
              </div>
            )}
            {evaluation.previousScore != null && (
              <div className={`rounded-lg p-3 text-center ${deltaPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <p className="text-[11px] text-muted-foreground">Cambio</p>
                <p className={`text-2xl font-bold ${deltaPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {deltaPositive ? '+' : ''}{delta}
                </p>
              </div>
            )}
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">Config usada</p>
              <p className="text-2xl font-bold">v{evaluation.configVersion}</p>
            </div>
          </div>

          {availabilityMatch && (
            <div
              className="mt-3 flex items-center gap-3 rounded-lg border p-3"
              style={{ borderLeftColor: availabilityMatch.range?.color ?? undefined, borderLeftWidth: availabilityMatch.range ? 4 : 1 }}
            >
              <Wallet2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground">
                  Rango de disponibilidad · Disponibilidad v{availabilityMatch.configVersion}
                </p>
                {availabilityMatch.range ? (
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: availabilityMatch.range.color }} />
                    {availabilityMatch.range.label} ({availabilityMatch.range.minScore}–{availabilityMatch.range.maxScore})
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Ningún rango configurado cubre este score — revisar la config de disponibilidad.
                  </p>
                )}
              </div>
              <Link
                href={`/admin/calculator/availability/${availabilityMatch.configId}`}
                className="text-xs text-primary hover:underline shrink-0"
              >
                Ver config
              </Link>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-3">
            {createdAtDisplay} · {TRIGGER_LABEL[evaluation.trigger] ?? evaluation.trigger}
            {evaluation.triggerReferenceId && ` · ref: ${evaluation.triggerReferenceId}`}
          </p>
        </CardContent>
      </Card>

      {/* Breakdown por dimensión */}
      {evaluation.dimensions.map((dim) => (
        <DimensionCard key={dim.code} dimension={dim} />
      ))}

      {/* Datos de entrada usados */}
      {snapshot && snapshot.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" /> Datos usados en el cálculo
              <span className="text-xs font-normal text-muted-foreground">({snapshot.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              {snapshot.map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm gap-2 border-b border-dashed py-1.5">
                  <span className="text-muted-foreground truncate">{prettifyKey(key)}</span>
                  <span className="font-mono font-medium text-right">{formatSnapshotValue(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DimensionCard({ dimension }: { dimension: DimensionResult }) {
  const capped = dimension.rawPoints > dimension.maxPoints;
  const Icon = DIMENSION_ICON[dimension.code] ?? Layers;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" /> {dimension.name}
          <span className="ml-auto font-mono text-sm font-semibold">
            {dimension.obtainedPoints} / {dimension.maxPoints}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {capped && (
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 mb-1">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Las reglas sumaron {dimension.rawPoints} pts en bruto — se capeó a {dimension.maxPoints}, el resto se perdió.
          </div>
        )}
        {dimension.rules.map((rule) => {
          const scored = rule.obtainedPoints > 0;
          return (
            <div
              key={rule.code}
              className={`flex items-start justify-between gap-3 text-xs pl-3 pr-2 py-2 border-l-2 rounded-r ${
                scored ? 'border-emerald-300 bg-emerald-50/60' : 'border-muted bg-muted/30'
              }`}
            >
              <div className="min-w-0">
                <span className={`font-medium ${scored ? 'text-foreground' : 'text-muted-foreground'}`}>{rule.name}</span>
                <p className="text-muted-foreground">{rule.reason}</p>
              </div>
              <span className={`font-mono font-semibold shrink-0 ${scored ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                {rule.obtainedPoints}/{rule.maxPoints}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
