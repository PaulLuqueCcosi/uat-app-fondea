import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { ReadOnlyField } from './ReadOnlyField';

interface UserScoreTabProps {
  score: any;
}

export function UserScoreTab({ score }: UserScoreTabProps) {
  if (!score) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">El usuario aún no tiene score calculado.</p>
        </CardContent>
      </Card>
    );
  }

  const dimensions = score.dimensions || {};

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Score Crediticio</CardTitle>
            <Button variant="outline" size="sm"><RefreshCw className="h-3.5 w-3.5 mr-1" /> Recalcular</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl font-bold text-primary">{score.total}</div>
            <div>
              <Badge variant="success">{score.level}</Badge>
              <p className="text-xs text-muted-foreground mt-1">Último cálculo: {score.lastCalculated ? new Date(score.lastCalculated).toLocaleDateString('es-PE') : '—'}</p>
            </div>
          </div>
          <div className="space-y-2">
            {Object.entries(dimensions).map(([key, value]) => {
              const numValue = value as number;
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${numValue}%` }} />
                    </div>
                    <span className="text-xs font-mono w-8 text-right">{numValue}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
