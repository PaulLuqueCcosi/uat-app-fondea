import { Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { PassportSummary } from '@/modules/passport';

interface PassportProgressProps {
  summary: PassportSummary;
}

/**
 * Barra de progreso hacia el siguiente nivel + grid de todos los niveles.
 * Componente TONTO — solo recibe props, solo muestra.
 */
export function PassportProgress({ summary }: PassportProgressProps) {
  const { currentLevelIndex, points, levels } = summary;
  const current = levels[currentLevelIndex];
  const next = levels[currentLevelIndex + 1] ?? null;
  const progressToNext = next
    ? Math.min(Math.round((points / next.minPoints) * 100), 100)
    : 100;

  return (
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
                style={{ width: `${progressToNext}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Te faltan{' '}
              <span className="font-semibold text-foreground">
                {next.minPoints - points} puntos
              </span>{' '}
              para desbloquear hasta S/ {next.maxAmount}
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
              <p
                className={`text-sm font-bold ${
                  i <= currentLevelIndex ? level.color : 'text-neutral-400'
                }`}
              >
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
  );
}
