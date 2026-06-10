'use client';

import { useEffect } from 'react';
import { Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreditScoreStore } from '@/lib/stores/credit-score-store';
import { ScoreGauge } from '@/components/credits';
import { CREDIT_BUREAU } from '@/lib/constants';
import type { ScoreRange } from '@/lib/types';

/**
 * Historial Crediticio — Gauge semicircular segmentado.
 * Usa el componente reutilizable ScoreGauge + datos del store.
 */
export function CreditScore() {
  const creditScore = useCreditScoreStore((s) => s.creditScore);
  const status = useCreditScoreStore((s) => s.status);
  const fetchCreditScore = useCreditScoreStore((s) => s.fetch);

  const scoreRanges = useCreditScoreStore((s) => s.scoreRanges);
  const rangesStatus = useCreditScoreStore((s) => s.rangesStatus);
  const fetchScoreRanges = useCreditScoreStore((s) => s.fetchScoreRanges);

  useEffect(() => {
    fetchCreditScore();
    fetchScoreRanges();
  }, [fetchCreditScore, fetchScoreRanges]);

  // Rango activo del usuario
  const activeRange =
    scoreRanges && scoreRanges.length > 0 && creditScore
      ? scoreRanges.find(
          (r: ScoreRange) => creditScore.score >= r.minScore && creditScore.score <= r.maxScore,
        ) ?? null
      : null;

  // Loading
  const isLoading =
    status === 'idle' || status === 'pending' || rangesStatus === 'idle' || rangesStatus === 'pending';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <Skeleton className="h-24 w-40 rounded" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  // Sin datos
  if (!creditScore) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-neutral-600">
            <Shield className="w-5 h-5" />
            Historial Crediticio
          </CardTitle>
          <CardDescription>
            Tu score se calculará después de tu primera solicitud.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Cálculos
  const rangeLabel = activeRange?.label ?? 'Sin categoría';
  const rangeColor = activeRange?.color ?? '#64748B';

  const globalMin =
    scoreRanges && scoreRanges.length > 0
      ? Math.min(...scoreRanges.map((r) => r.minScore))
      : 0;
  const globalMax =
    scoreRanges && scoreRanges.length > 0
      ? Math.max(...scoreRanges.map((r) => r.maxScore))
      : 1000;
  const totalSpan = globalMax - globalMin || 1;

  // Valor normalizado 0-1 para el gauge
  const gaugeValue = Math.min(1, Math.max(0, (creditScore.score - globalMin) / totalSpan));

  // Labels del gauge (los 3 rangos principales)
  const gaugeLabels =
    scoreRanges && scoreRanges.length >= 3
      ? scoreRanges
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((r) => r.label)
          .slice(0, 3)
      : ['Bajo', 'Medio', 'Alto'];

  const updatedDate = new Date(creditScore.updatedAt).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Historial Crediticio
        </CardTitle>
        <CardDescription>
          Powered by <span className="font-semibold text-foreground">{CREDIT_BUREAU.name}</span>
        </CardDescription>
        <CardAction>
          <img
            src={CREDIT_BUREAU.logoUrl}
            alt={CREDIT_BUREAU.name}
            width={CREDIT_BUREAU.logoWidth}
            height={CREDIT_BUREAU.logoHeight}
          />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-2">
        {/* Gauge semicircular reutilizable */}
        <div className="w-full max-w-[150px]">
          <ScoreGauge value={gaugeValue} labels={gaugeLabels} />
        </div>

        {/* Score + label */}
        <div className="text-center -mt-2">
          <p className="text-2xl font-extrabold" style={{ color: rangeColor }}>
            {creditScore.score}
          </p>
          <p className="text-[11px] font-medium" style={{ color: rangeColor }}>
            {rangeLabel}
          </p>
        </div>

        {/* Fecha */}
        <p className="text-[10px] text-muted-foreground">
          Actualizado: {updatedDate}
        </p>
      </CardContent>
    </Card>
  );
}
