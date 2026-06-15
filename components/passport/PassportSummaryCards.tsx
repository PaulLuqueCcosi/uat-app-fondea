import { Card, CardContent } from '@/components/ui/card';
import type { PassportSummary } from '@/modules/passport';

interface PassportSummaryCardsProps {
  summary: PassportSummary;
}

/**
 * Cards de resumen: nivel actual, puntos, límite actual, próximo límite.
 * Componente TONTO — solo recibe props, solo muestra.
 */
export function PassportSummaryCards({ summary }: PassportSummaryCardsProps) {
  const { currentLevelIndex, points, levels } = summary;
  const current = levels[currentLevelIndex];
  const next = levels[currentLevelIndex + 1] ?? null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card>
        <CardContent className="pt-4 pb-3 text-center">
          <p className={`text-2xl font-bold ${current.meta.color}`}>{current.name}</p>
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
          <p className="text-2xl font-bold text-primary">S/ {current.maxLoanAmount}</p>
          <p className="text-[10px] text-muted-foreground">Límite actual</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-3 text-center">
          <p className="text-2xl font-bold text-success-700">
            {next ? `S/ ${next.maxLoanAmount}` : '—'}
          </p>
          <p className="text-[10px] text-muted-foreground">Próximo límite</p>
        </CardContent>
      </Card>
    </div>
  );
}
