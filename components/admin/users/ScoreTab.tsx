'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ScoreTabProps {
  score: {
    total: number;
    level: string;
    lastCalculated: string;
  };
}

// Mock historial de scores
const MOCK_SCORE_HISTORY = [
  { score: 720, level: 'BUENO', calculatedAt: '2026-06-25T10:00:00Z', trigger: 'Solicitud app_001' },
  { score: 680, level: 'BUENO', calculatedAt: '2026-05-15T14:00:00Z', trigger: 'Solicitud app_000 (rechazada)' },
];

// Mock de resultado Sentinel
const MOCK_SENTINEL = {
  score: 680,
  calificacion: 'NORMAL',
  deudasVigentes: 2,
  deudasVencidas: 0,
  montoTotal: 12500,
  ultimaConsulta: '2026-06-28T10:00:00Z',
  entidades: ['BCP', 'Interbank'],
};

export function ScoreTab({ score }: ScoreTabProps) {
  const [showRecalcModal, setShowRecalcModal] = useState(false);
  const [showSentinelModal, setShowSentinelModal] = useState(false);
  const [sentinelData, setSentinelData] = useState<typeof MOCK_SENTINEL | null>(null);
  const [loadingSentinel, setLoadingSentinel] = useState(false);

  const handleRecalculate = () => {
    setShowRecalcModal(false);
    // TODO: llamar al backend para recalcular
  };

  const handleConsultSentinel = () => {
    setShowSentinelModal(false);
    setLoadingSentinel(true);
    // Simular consulta
    setTimeout(() => {
      setSentinelData(MOCK_SENTINEL);
      setLoadingSentinel(false);
    }, 1500);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Interno */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Score Interno</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowRecalcModal(true)}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Recalcular
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-primary">{score.total}</div>
              <div>
                <Badge variant="success">{score.level}</Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Último: {new Date(score.lastCalculated).toLocaleDateString('es-PE')}
                </p>
              </div>
            </div>

            {/* Historial de scores */}
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Historial de cálculos</p>
              <div className="space-y-2">
                {MOCK_SCORE_HISTORY.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-medium">{entry.score}</span>
                      <span className="text-muted-foreground ml-2">{entry.trigger}</span>
                    </div>
                    <span className="text-muted-foreground">{new Date(entry.calculatedAt).toLocaleDateString('es-PE')}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Sentinel */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Sentinel</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSentinelModal(true)}
                disabled={loadingSentinel}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loadingSentinel ? 'animate-spin' : ''}`} />
                {loadingSentinel ? 'Consultando...' : 'Consultar'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sentinelData ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-foreground">{sentinelData.score}</div>
                  <div>
                    <Badge variant={sentinelData.calificacion === 'NORMAL' ? 'success' : 'warning'}>
                      {sentinelData.calificacion}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Consultado: {new Date(sentinelData.ultimaConsulta).toLocaleDateString('es-PE')}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deudas vigentes</span>
                    <span className="font-medium">{sentinelData.deudasVigentes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deudas vencidas</span>
                    <span className="font-medium">{sentinelData.deudasVencidas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto total reportado</span>
                    <span className="font-mono font-medium">S/ {sentinelData.montoTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entidades</span>
                    <span className="font-medium">{sentinelData.entidades.join(', ')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-muted-foreground">—</div>
                <div>
                  <Badge variant="secondary">Sin consulta</Badge>
                  <p className="text-xs text-muted-foreground mt-1">No se ha consultado aún</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal confirmar recalcular */}
      <AlertDialog open={showRecalcModal} onOpenChange={setShowRecalcModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Recalcular score interno?</AlertDialogTitle>
            <AlertDialogDescription>
              Se ejecutará el algoritmo de scoring con los datos actuales del usuario. El score anterior se reemplazará.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRecalculate}>Recalcular</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal confirmar consulta Sentinel */}
      <AlertDialog open={showSentinelModal} onOpenChange={setShowSentinelModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Consultar Sentinel?</AlertDialogTitle>
            <AlertDialogDescription>
              Se realizará una consulta al buró crediticio Sentinel. Esta operación tiene un costo y quedará registrada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConsultSentinel}>Consultar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
