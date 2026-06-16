import { TrendingUp, Gift } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Historial de puntos
          </span>
        </CardTitle>
        <CardDescription>
          {history.length} {history.length === 1 ? 'movimiento' : 'movimientos'} registrados
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-300" />
            </div>
            <p className="text-sm font-medium text-foreground">Sin movimientos aún</p>
            <p className="text-xs text-muted-foreground text-center max-w-[220px]">
              Tus puntos ganados y canjeados aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 py-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    entry.type === 'EARNED' ? 'bg-accent-50' : 'bg-error-50'
                  }`}
                >
                  {entry.type === 'EARNED' ? (
                    <Gift className="w-4 h-4 text-accent-700" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-error-500 rotate-180" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {entry.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(entry.date)}
                  </p>
                </div>
                <span
                  className={`text-sm font-bold shrink-0 ${
                    entry.type === 'EARNED' ? 'text-accent-600' : 'text-error-600'
                  }`}
                >
                  {entry.type === 'EARNED' ? '+' : '-'}{entry.points} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
