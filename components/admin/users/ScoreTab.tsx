'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, ChevronRight } from 'lucide-react';
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
import type { ScoreEvaluation, BuroReport } from '@/modules/admin';
import { recalculateScoreAction, consultBuroAction } from '@/app/actions/admin-user-score.actions';
import { SCORE_LEVEL_VARIANT, TRIGGER_LABEL } from './EvaluationBreakdown';

interface ScoreTabProps {
  userId: string;
  evaluations: ScoreEvaluation[];
  /** id de evaluación → fecha ya formateada (server-side, ver score-format.ts) */
  evaluationDates: Record<string, string>;
  buro: BuroReport | null;
  buroConsultedAtDisplay: string | null;
  buroExpiresAtDisplay: string | null;
}

const SBS_LABEL: Record<string, { label: string; variant: 'success' | 'warning' | 'error' }> = {
  NORMAL: { label: 'Normal', variant: 'success' },
  CPP: { label: 'Con problemas potenciales', variant: 'warning' },
  DEFICIENTE: { label: 'Deficiente', variant: 'error' },
  DUDOSO: { label: 'Dudoso', variant: 'error' },
  PERDIDA: { label: 'Pérdida', variant: 'error' },
};

function formatMoney(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ScoreTab({ userId, evaluations, evaluationDates, buro, buroConsultedAtDisplay, buroExpiresAtDisplay }: ScoreTabProps) {
  const router = useRouter();

  const [showRecalcModal, setShowRecalcModal] = useState(false);
  const [recalcPending, startRecalc] = useTransition();
  const [recalcMessage, setRecalcMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showBuroModal, setShowBuroModal] = useState(false);
  const [buroPending, startBuro] = useTransition();
  const [buroMessage, setBuroMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const current = evaluations[0] ?? null;

  const handleRecalculate = () => {
    setShowRecalcModal(false);
    setRecalcMessage(null);

    startRecalc(async () => {
      const result = await recalculateScoreAction(userId);

      if (!result) {
        setRecalcMessage({ type: 'error', text: 'Error de conexión al recalcular el score.' });
        return;
      }
      if (!result.success) {
        setRecalcMessage({ type: 'error', text: result.errorMessage ?? 'No se pudo recalcular el score.' });
        return;
      }

      setRecalcMessage({ type: 'success', text: `Score recalculado: ${result.newScore} (${result.scoreLevel})` });
      router.refresh();
    });
  };

  const handleConsultBuro = () => {
    setShowBuroModal(false);
    setBuroMessage(null);

    startBuro(async () => {
      const result = await consultBuroAction(userId);

      if (!result.ok) {
        setBuroMessage({ type: 'error', text: result.message ?? 'No se pudo consultar el buró.' });
        return;
      }

      setBuroMessage({ type: 'success', text: 'Consulta al buró completada.' });
      router.refresh();
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Interno */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Score Interno</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRecalcModal(true)}
                disabled={recalcPending}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${recalcPending ? 'animate-spin' : ''}`} />
                {recalcPending ? 'Calculando...' : 'Recalcular'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {current ? (
              <Link
                href={`/admin/users/${userId}/score/${current.id}`}
                className="flex items-center gap-4 w-full text-left rounded-lg -m-1 p-1 hover:bg-muted/40 transition-colors"
              >
                <div className="text-4xl font-bold text-primary">{current.totalScore}</div>
                <div className="flex-1 min-w-0">
                  <Badge variant={SCORE_LEVEL_VARIANT[current.scoreLevel] ?? 'secondary'}>
                    {current.scoreLevel}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    Último: {evaluationDates[current.id]} · v{current.configVersion} · {TRIGGER_LABEL[current.trigger] ?? current.trigger}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-muted-foreground">—</div>
                <div>
                  <Badge variant="secondary">Sin calcular</Badge>
                  <p className="text-xs text-muted-foreground mt-1">Este usuario no tiene score calculado aún</p>
                </div>
              </div>
            )}

            {recalcMessage && (
              <p className={`text-xs ${recalcMessage.type === 'success' ? 'text-emerald-600' : 'text-destructive'}`}>
                {recalcMessage.text}
              </p>
            )}

            {/* Historial de scores */}
            {evaluations.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Historial de cálculos</p>
                  <div className="space-y-1">
                    {evaluations.map((entry) => (
                      <Link
                        key={entry.id}
                        href={`/admin/users/${userId}/score/${entry.id}`}
                        className="flex items-center justify-between text-xs w-full text-left rounded px-1.5 py-1 -mx-1.5 hover:bg-muted/40 transition-colors"
                      >
                        <div className="min-w-0">
                          <span className="font-mono font-medium">{entry.totalScore}</span>
                          <span className="text-muted-foreground ml-2">{TRIGGER_LABEL[entry.trigger] ?? entry.trigger}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-muted-foreground">{evaluationDates[entry.id]}</span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Buró crediticio */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Buró Crediticio{buro ? ` (${buro.provider})` : ''}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBuroModal(true)}
                disabled={buroPending}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${buroPending ? 'animate-spin' : ''}`} />
                {buroPending ? 'Consultando...' : 'Consultar'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {buro ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-foreground">{buro.buroScore ?? '—'}</div>
                  <div>
                    {buro.worstClassification && (
                      <Badge variant={SBS_LABEL[buro.worstClassification]?.variant ?? 'secondary'}>
                        {SBS_LABEL[buro.worstClassification]?.label ?? buro.worstClassification}
                      </Badge>
                    )}
                    {!buro.isValid && (
                      <Badge variant="warning" className="ml-1.5">Vencido</Badge>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Consultado: {buroConsultedAtDisplay} · vence {buroExpiresAtDisplay}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deudas totales</span>
                    <span className="font-medium">{buro.totalDebtsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deudas en mora</span>
                    <span className="font-medium">{buro.overdueDebtsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto total reportado</span>
                    <span className="font-mono font-medium">{formatMoney(buro.totalDebtAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto en mora</span>
                    <span className="font-mono font-medium">{formatMoney(buro.overdueDebtAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entidades</span>
                    <span className="font-medium">{buro.entitiesCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Protestos</span>
                    <span className="font-medium">{buro.protestsCount}</span>
                  </div>
                </div>
                <Link
                  href={`/admin/users/${userId}/buro`}
                  className="flex items-center justify-center gap-1 text-xs text-primary hover:underline pt-1"
                >
                  Ver detalle completo <ChevronRight className="h-3 w-3" />
                </Link>
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

            {buroMessage && (
              <p className={`text-xs mt-3 ${buroMessage.type === 'success' ? 'text-emerald-600' : 'text-destructive'}`}>
                {buroMessage.text}
              </p>
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
              Se ejecutará el algoritmo de scoring con la config activa y los datos actuales del usuario
              (perfil, historial crediticio, buró, score previo). Queda registrado en el historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRecalculate}>Recalcular</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal confirmar consulta buró */}
      <AlertDialog open={showBuroModal} onOpenChange={setShowBuroModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Consultar buró crediticio?</AlertDialogTitle>
            <AlertDialogDescription>
              Se realizará una consulta al buró crediticio (sin throttle, es admin). Esta operación
              tiene costo en producción y quedará registrada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConsultBuro}>Consultar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
