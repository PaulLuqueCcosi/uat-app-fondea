'use client';

import { Award, TrendingUp, Gift } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PassportSummary, PointsHistoryEntry } from '@/lib/passport';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PasaporteContentProps {
  summary: PassportSummary;
  history: PointsHistoryEntry[];
}

export function PasaporteContent({ summary, history }: PasaporteContentProps) {
  const { currentLevelIndex, points, levels } = summary;
  const current = levels[currentLevelIndex];
  const next = levels[currentLevelIndex + 1];
  const progressToNext = next
    ? Math.round((points / next.minPoints) * 100)
    : 100;

  return (
    <div className="flex flex-col gap-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className={`text-2xl font-bold ${current.color}`}>{current.name}</p>
            <p className="text-[10px] text-muted-foreground">Nivel actual</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-foreground">{points}</p>
            <p className="text-[10px] text-muted-foreground">Puntos totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-primary">S/ {current.maxAmount}</p>
            <p className="text-[10px] text-muted-foreground">Límite actual</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-success-700">
              {next ? `S/ ${next.maxAmount}` : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">Próximo límite</p>
          </CardContent>
        </Card>
      </div>

      {/* Progreso + niveles */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="w-4 h-4 text-amber-600" />
            Progreso de nivel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra de progreso */}
          {next && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {current.name} → {next.name}
                </span>
                <span className="font-medium text-foreground">
                  {points}/{next.minPoints} pts
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${Math.min(progressToNext, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Te faltan <span className="font-semibold text-foreground">{next.minPoints - points} puntos</span> para
                desbloquear hasta S/ {next.maxAmount}
              </p>
            </div>
          )}

          {/* Todos los niveles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {levels.map((level, i) => (
              <div
                key={level.name}
                className={`rounded-lg border p-3 text-center ${
                  i <= currentLevelIndex
                    ? `${level.bgColor} ${level.borderColor}`
                    : 'bg-neutral-50 border-neutral-200 opacity-50'
                }`}
              >
                <div className="flex justify-center mb-1">
                  <img
                    src={level.image}
                    alt={level.name}
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <p className={`text-sm font-bold ${i <= currentLevelIndex ? level.color : 'text-neutral-400'}`}>
                  {level.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {level.minPoints} pts · S/ {level.maxAmount}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historial de puntos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            Historial de puntos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aún no tienes movimientos de puntos.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 py-2.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      entry.type === 'EARNED' ? 'bg-success-50' : 'bg-error-50'
                    }`}
                  >
                    {entry.type === 'EARNED' ? (
                      <Gift className="w-4 h-4 text-success-600" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-error-500 rotate-180" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{entry.description}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(entry.date)}</p>
                  </div>
                  <Badge
                    variant={entry.type === 'EARNED' ? 'success' : 'error'}
                    className="text-[10px] shrink-0"
                  >
                    {entry.type === 'EARNED' ? '+' : '-'}{entry.points} pts
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
