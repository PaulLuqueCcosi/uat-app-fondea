'use client';

import { useEffect } from 'react';
import { useScoreStore } from '@/lib/stores/score-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Award } from 'lucide-react';

/**
 * Card que muestra el puntaje del usuario — límite de préstamo del sistema.
 * Se carga desde el store de Zustand.
 */
export function PuntajeCard() {
  const score = useScoreStore(s => s.score);
  const isReady = useScoreStore(s => s.isReady);
  const fetchScore = useScoreStore(s => s.fetchScore);

  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  if (!isReady) {
    return (
      <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
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

  if (!score) {
    return (
      <Card className="border-neutral-200 bg-neutral-50">
        <CardHeader>
          <CardTitle className="text-neutral-600">Puntaje no disponible</CardTitle>
          <CardDescription>
            No pudimos cargar tu información de puntaje. Intenta más tarde.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Calcular porcentaje de uso del límite (para visualización)
  const usagePercentage = 0; // Por ahora, asumimos que no hay uso

  return (
    <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100/50 overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-200/20 rounded-full -mr-16 -mt-16" />

      <CardHeader className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-primary-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-600" />
              Tu Puntaje
            </CardTitle>
            <CardDescription className="text-primary-700">
              Límite de préstamo disponible
            </CardDescription>
          </div>
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-500 text-white shadow-lg">
            <span className="text-2xl font-bold">{score.points}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-6">
        {/* Límite de préstamo */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary-800">Límite de préstamo</span>
            <span className="text-xs text-primary-600">Máximo disponible</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary-900">
              S/ {score.maxLoanAmount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {/* Barra de progreso visual */}
          <div className="mt-3 h-2 bg-primary-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Info adicional */}
        <div className="pt-2 border-t border-primary-200">
          <div className="flex items-center gap-2 text-sm text-primary-700">
            <TrendingUp className="w-4 h-4 text-primary-600" />
            <span>Tu puntaje determina el límite máximo de crédito disponible</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
