'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2, Clock, CheckCircle2, XCircle, AlertCircle,
  ArrowRight, RefreshCw, Home,
} from 'lucide-react';
import { getApplicationStatusAction } from '@/app/actions/application.actions';
import type { EvaluationResult } from '@/lib/types';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type PageState = 'evaluating' | 'approved' | 'rejected';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRetryDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-PE', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── Vistas de resultado ───────────────────────────────────────────────────────

function ApprovedView({ solicitudId }: { solicitudId: string }) {
  const router = useRouter();

  // Auto-redirigir a la página principal de la solicitud después de 2 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(`/solicitudes/${solicitudId}`);
    }, 2000);
    return () => clearTimeout(timer);
  }, [solicitudId, router]);

  return (
    <div className="flex flex-col items-center text-center space-y-6">
      <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
        <CheckCircle2 className="w-12 h-12 text-green-500" />
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          ¡Tu solicitud fue aprobada!
        </h1>
        <p className="text-muted-foreground">
          Redirigiendo...
        </p>
      </div>

      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }} />
      </div>
    </div>
  );
}

function RejectedView({ solicitudId, canRetryAt }: { solicitudId: string; canRetryAt?: string }) {
  const router = useRouter();
  const retryDate = canRetryAt ? formatRetryDate(canRetryAt) : null;

  // Auto-redirigir a la página principal de la solicitud después de 2 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(`/solicitudes/${solicitudId}`);
    }, 2000);
    return () => clearTimeout(timer);
  }, [solicitudId, router]);

  return (
    <div className="flex flex-col items-center text-center space-y-6">
      <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
        <XCircle className="w-12 h-12 text-destructive" />
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Solicitud no aprobada
        </h1>
        <p className="text-muted-foreground">
          Redirigiendo...
        </p>
      </div>

      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-destructive animate-pulse" style={{ width: '100%' }} />
      </div>
    </div>
  );
}

function EvaluatingView({ timeElapsed }: { timeElapsed: number }) {
  const TOTAL = 5;
  const progress = Math.min((timeElapsed / TOTAL) * 100, 95); // nunca llega al 100 hasta tener resultado

  return (
    <div className="flex flex-col items-center text-center space-y-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <Clock className="w-4 h-4 text-dark" />
        </div>
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Evaluando tu solicitud…
        </h1>
        <p className="text-muted-foreground">
          Estamos analizando tu información. Solo tomará unos segundos.
        </p>
      </div>

      <div className="w-full space-y-2">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">Analizando…</p>
      </div>

      <div className="w-full space-y-2">
        {[
          { label: 'Verificación de identidad', done: true },
          { label: 'Análisis crediticio en progreso', done: false, active: true },
          { label: 'Validación final', done: false },
        ].map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-lg ${
              step.active ? 'bg-primary/5 border border-primary/20' :
              step.done   ? 'bg-muted/50' : 'bg-muted/30 opacity-50'
            }`}
          >
            {step.done
              ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              : step.active
                ? <Loader2 className="w-5 h-5 text-primary shrink-0 animate-spin" />
                : <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
            }
            <span className={`text-sm ${step.active ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 w-full text-left">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            No cierres esta ventana. Recibirás el resultado en breve.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function EvaluandoPage() {
  const params      = useParams();
  const solicitudId = params.id as string;

  const [pageState,   setPageState]   = useState<PageState>('evaluating');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [canRetryAt,  setCanRetryAt]  = useState<string | undefined>();

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer de segundos (solo para la barra de progreso visual)
  useEffect(() => {
    timerRef.current = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Polling cada 5 segundos
  useEffect(() => {
    const poll = async () => {
      try {
        const data = await getApplicationStatusAction(solicitudId);
        if (!data) return;

        if (data.status === 'approved') {
          stopPolling();
          setPageState('approved');
        } else if (data.status === 'rejected') {
          stopPolling();
          setCanRetryAt(data.canRetryAt);
          setPageState('rejected');
        }
        // si sigue 'evaluating', no hacemos nada — el polling continúa
      } catch (e) {
        console.error('[POLLING] Error:', e);
      }
    };

    // Primera consulta inmediata
    poll();
    pollingRef.current = setInterval(poll, 5000);

    return () => stopPolling();
  }, [solicitudId]);

  function stopPolling() {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    if (timerRef.current)   { clearInterval(timerRef.current);   timerRef.current   = null; }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8">
        {pageState === 'evaluating' && <EvaluatingView timeElapsed={timeElapsed} />}
        {pageState === 'approved'   && <ApprovedView   solicitudId={solicitudId} />}
        {pageState === 'rejected'   && <RejectedView   solicitudId={solicitudId} canRetryAt={canRetryAt} />}
      </Card>
    </div>
  );
}
