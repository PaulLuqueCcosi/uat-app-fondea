import { TrendingUp, Gift } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PointsHistoryEntry } from '@/modules/passport';

interface PassportHistoryProps {
  history: PointsHistoryEntry[];
}

// ── Helper ────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ── Componente ────────────────────────────────────────────────────────────────

/**
 * Historial de movimientos de puntos (ganados y canjeados).
 * Componente TONTO — solo recibe props, solo muestra.
 */
export function PassportHistory({ history }: PassportHistoryProps) {
  return (
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
                  <p className="text-sm font-medium text-foreground">
                    {entry.description}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDate(entry.date)}
                  </p>
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
  );
}
