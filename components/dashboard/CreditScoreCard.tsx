'use client';

import { useEffect } from 'react';
import { useCreditScoreStore } from '@/lib/stores/credit-score-store';
import type { ScoreRange } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Card que muestra el score crediticio del usuario (0-1000).
 * Usa los rangos reales del producto (/api/calculadora/score-ranges)
 * para mostrar label, color y una barra segmentada.
 */
export function CreditScoreCard() {
  const creditScore = useCreditScoreStore(s => s.creditScore);
  const status = useCreditScoreStore(s => s.status);
  const fetchCreditScore = useCreditScoreStore(s => s.fetch);

  const scoreRanges = useCreditScoreStore(s => s.scoreRanges);
  const rangesStatus = useCreditScoreStore(s => s.rangesStatus);
  const fetchScoreRanges = useCreditScoreStore(s => s.fetchScoreRanges);

  useEffect(() => {
    fetchCreditScore();
    fetchScoreRanges();
  }, [fetchCreditScore, fetchScoreRanges]);

  // ── Rango del usuario (SIEMPRE antes de condicionales) ──────────────────────

  const activeRange =
    scoreRanges && scoreRanges.length > 0 && creditScore
      ? scoreRanges.find(
          (r: ScoreRange) => creditScore.score >= r.minScore && creditScore.score <= r.maxScore,
        ) ?? null
      : null;

  // ── Skeleton ────────────────────────────────────────────────────────────────

  const isLoading = status === 'idle' || status === 'pending' || rangesStatus === 'idle' || rangesStatus === 'pending';

  if (isLoading) {
    return (
      <Card className="border-accent-200 bg-gradient-to-br from-accent-50 to-accent-100/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Barra segmentada skeleton */}
          <div className="flex gap-1 h-3">
            <Skeleton className="flex-1 rounded-l-full" />
            <Skeleton className="flex-1" />
            <Skeleton className="flex-1 rounded-r-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Sin datos ───────────────────────────────────────────────────────────────

  if (!creditScore) {
    return (
      <Card className="border-neutral-200 bg-neutral-50">
        <CardHeader>
          <CardTitle className="text-neutral-600">Score crediticio no disponible</CardTitle>
          <CardDescription>
            Tu score se calculará después de tu primera solicitud.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const rangeLabel = activeRange?.label ?? 'Sin categoría';
  const rangeColor = activeRange?.color ?? '#64748B';

  // ── Barra segmentada ────────────────────────────────────────────────────────

  // Calcular ancho proporcional de cada segmento basado en el rango total
  const globalMin = scoreRanges && scoreRanges.length > 0
    ? Math.min(...scoreRanges.map(r => r.minScore))
    : 0;
  const globalMax = scoreRanges && scoreRanges.length > 0
    ? Math.max(...scoreRanges.map(r => r.maxScore))
    : 1000;
  const totalSpan = globalMax - globalMin || 1;

  // Posición del indicador (score sobre la barra total)
  const indicatorPct = Math.min(
    100,
    Math.max(0, ((creditScore.score - globalMin) / totalSpan) * 100),
  );

  // Formatear fecha
  const updatedDate = new Date(creditScore.updatedAt).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card className="border-accent-200 bg-gradient-to-br from-accent-50 to-accent-100/50 overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-200/20 rounded-full -mr-16 -mt-16" />

      <CardHeader className="relative z-10 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-accent-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent-600" />
              Tu Score Crediticio
            </CardTitle>
            <CardDescription className="text-accent-700">
              Indicador de tu historial crediticio
            </CardDescription>
          </div>
          <Badge label={rangeLabel} color={rangeColor} />
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-5">
        {/* Score grande */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold text-accent-900 tracking-tight">
            {creditScore.score}
          </span>
          <span className="text-sm text-accent-600 font-medium">/ 1000</span>
        </div>

        {/* Barra segmentada con indicador */}
        <div className="space-y-1.5">
          <div className="relative">
            {/* Segments */}
            <div className="flex h-3 rounded-full overflow-hidden">
              {scoreRanges && scoreRanges.length > 0 ? (
                scoreRanges
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((range: ScoreRange) => {
                    const span = range.maxScore - range.minScore;
                    const widthPct = (span / totalSpan) * 100;
                    return (
                      <div
                        key={range.code}
                        className="h-full transition-all"
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: range.color,
                        }}
                        title={`${range.label}: ${range.minScore} – ${range.maxScore}`}
                      />
                    );
                  })
              ) : (
                // Fallback sin rangos
                <div className="flex-1 h-full bg-accent-300 rounded-full" />
              )}
            </div>

            {/* Indicador vertical */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500"
              style={{ left: `${indicatorPct}%` }}
            >
              <div className="w-0.5 h-5 bg-white shadow-[0_0_0_2px_rgba(255,255,255,1)] rounded-full" />
            </div>
          </div>

          {/* Labels de min/max */}
          {scoreRanges && scoreRanges.length > 0 && (
            <div className="flex justify-between text-[10px] text-accent-600 font-medium px-0.5">
              <span>{globalMin}</span>
              <span>{globalMax}</span>
            </div>
          )}
        </div>

        {/* Info adicional */}
        <div className="pt-3 border-t border-accent-200 space-y-2">
          <div className="flex items-center gap-2 text-sm text-accent-700">
            <TrendingUp className="w-4 h-4 text-accent-600 shrink-0" />
            <span>Actualizado el {updatedDate}</span>
          </div>
          <p className="text-xs text-accent-600">
            Tu score se recalcula después de cada solicitud.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold',
      )}
      style={{
        backgroundColor: `${color}18`, // ~10% opacity hex
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
    </span>
  );
}
