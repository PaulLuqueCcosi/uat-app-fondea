import { Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AchievementBadge } from '@/components/ui/achievement-badge';
import type { UserAchievement } from '@/components/ui/achievement-badge';
import type { PassportSummary } from '@/modules/passport';

interface PassportProgressProps {
  summary: PassportSummary;
}

/**
 * Progreso de nivel con "sellos" del pasaporte.
 * Usa AchievementBadge para dar aspecto visual de stamps/sellos coleccionables.
 */
export function PassportProgress({ summary }: PassportProgressProps) {
  const { currentLevelIndex, points, levels } = summary;
  const current = levels[currentLevelIndex];
  const next = levels[currentLevelIndex + 1] ?? null;
  const progressToNext = next
    ? Math.min(Math.round((points / next.minPoints) * 100), 100)
    : 100;

  // Convertir niveles a formato de AchievementBadge (sellos)
  const achievements: UserAchievement[] = levels.map((level, i) => {
    const isUnlocked = i <= currentLevelIndex;
    const isCurrent = i === currentLevelIndex;

    let progress: number | undefined;
    if (isCurrent && next) {
      progress = Math.round((points / next.minPoints) * 100);
    } else if (isUnlocked) {
      progress = 100;
    }

    return {
      id: `level-${i}`,
      name: level.name,
      trigger: 'metric' as const,
      badgeUrl: level.image,
      progress,
      achievedAt: isUnlocked ? '2026-01-01' : null,
    };
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="w-4 h-4 text-amber-600" />
          Sellos de nivel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sellos (badges) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {achievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              badgeSize="lg"
            />
          ))}
        </div>

        {/* Barra de progreso al siguiente nivel */}
        {next && (
          <div className="space-y-2 pt-2">
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
      </CardContent>
    </Card>
  );
}
