'use client';

import { useEffect } from 'react';
import { useCreditScoreStore } from '@/lib/stores/credit-score-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Zap } from 'lucide-react';

/**
 * Card que muestra el score crediticio del usuario (0-1000).
 * Se recarga después de submit y cuando llega el resultado de la solicitud.
 */
export function CreditScoreCard() {
  const creditScore = useCreditScoreStore(s => s.creditScore);
  const status = useCreditScoreStore(s => s.status);
  const fetchCreditScore = useCreditScoreStore(s => s.fetch);

  useEffect(() => {
    fetchCreditScore();
  }, [fetchCreditScore]);

  // Skeleton: idle o pending
  if (status === 'idle' || status === 'pending') {
    return (
      <Card className="border-accent-200 bg-gradient-to-br from-accent-50 to-accent-100/50">
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

  // Calcular categoría del score
  const getScoreCategory = (score: number): { label: string; color: string } => {
    if (score >= 750) return { label: 'Excelente', color: 'text-success-600' };
    if (score >= 650) return { label: 'Bueno', color: 'text-primary-600' };
    if (score >= 550) return { label: 'Regular', color: 'text-warning-600' };
    return { label: 'Bajo', color: 'text-error-600' };
  };

  const category = getScoreCategory(creditScore.score);
  const percentage = (creditScore.score / 1000) * 100;

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

      <CardHeader className="relative z-10">
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
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent-500 text-neutral-900 shadow-lg">
            <span className="text-2xl font-bold">{creditScore.score}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-6">
        {/* Score visual */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-accent-800">Rango de score</span>
            <span className={`text-xs font-semibold ${category.color}`}>
              {category.label}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-accent-900">
              {creditScore.score}
            </span>
            <span className="text-sm text-accent-700">/ 1000</span>
          </div>
          {/* Barra de progreso visual */}
          <div className="mt-3 h-2 bg-accent-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-500 to-accent-600 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Info adicional */}
        <div className="pt-2 border-t border-accent-200 space-y-2">
          <div className="flex items-center gap-2 text-sm text-accent-700">
            <TrendingUp className="w-4 h-4 text-accent-600" />
            <span>Actualizado el {updatedDate}</span>
          </div>
          <p className="text-xs text-accent-600">
            Tu score se recalcula después de cada solicitud y cambios en tu perfil.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
