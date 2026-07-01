import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, DollarSign, Calendar } from 'lucide-react';
import { ReadOnlyField } from './ReadOnlyField';

interface UserGamificationTabProps {
  gamification: any;
}

export function UserGamificationTab({ gamification }: UserGamificationTabProps) {
  if (!gamification) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">El usuario aún no tiene puntos gamificados.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Puntaje Gamificado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{gamification.points}</p>
              <p className="text-xs text-muted-foreground">Puntos</p>
            </div>
            <div className="text-center">
              <Badge>{gamification.rank}</Badge>
              <p className="text-xs text-muted-foreground mt-1">Rango</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">S/ {gamification.maxLoanAmount?.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Máx. préstamo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Historial de Movimientos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2">Fecha</th>
                  <th className="text-left px-3 py-2">Concepto</th>
                  <th className="text-right px-3 py-2">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {gamification.history?.map((h: any, i: number) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{h.date}</td>
                    <td className="px-3 py-2">{h.concept}</td>
                    <td className="px-3 py-2 text-right font-mono text-success-600">+{h.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
