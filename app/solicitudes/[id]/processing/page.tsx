'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ApprovedCelebration } from '@/components/solicitudes/ApprovedCelebration';
import { useSolicitudStore } from '@/lib/stores/solicitud-store';
import type { ApplicationStatus } from '@/lib/types';

const POLL_INTERVAL = 10_000;
const MAX_ATTEMPTS = 30;

export default function ProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const storeAppId = useSolicitudStore(s => s.applicationId);
  const init = useSolicitudStore(s => s.init);

  const [showCelebration, setShowCelebration] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef = useRef(0);
  const mountedRef = useRef(true);

  const FIRST_POLL_DELAY = 3000;

  useEffect(() => {
    mountedRef.current = true;

    if (!applicationId) return;

    // Inicializar store si es necesario (primera vez o cambio de ID)
    if (storeAppId !== applicationId) {
      init(applicationId);
    }

    const { fetchIntention } = useSolicitudStore.getState();

    const poll = async () => {
      if (!mountedRef.current) return;

      attemptsRef.current += 1;

      if (attemptsRef.current > MAX_ATTEMPTS) {
        router.replace(`/solicitudes/${applicationId}`);
        return;
      }

      try {
        const res = await fetch(`/api/solicitudes/${applicationId}/status`, { cache: 'no-store' });
        if (res.status === 404) return;
        if (!res.ok) return;
        const statusRaw = await res.json();
        if (!statusRaw) return;

        const status = statusRaw.status as ApplicationStatus;

        if (status === 'SUBMITTED' || status === 'PROCESSING') return;

        // Status terminal → refrescar aplicación en store y navegar
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        await useSolicitudStore.getState().refreshApplication();

        if (!mountedRef.current) return;

        if (status === 'PRE_APPROVED' || status === 'PENDING_DOCUMENTS') {
          setShowCelebration(true);
          await new Promise((resolve) => setTimeout(resolve, 2500));
          if (!mountedRef.current) return;
        }

        router.replace(`/solicitudes/${applicationId}`);
      } catch (err) {
        console.error('[ProcessingPage] Polling error:', err);
      }
    };

    // Obtener intención de la solicitud inmediatamente (para el resumen del sidebar)
    fetchIntention();

    // Primer poll con delay de 3s, luego cada 10s
    const firstTimeout = setTimeout(() => {
      poll();
      intervalRef.current = setInterval(poll, POLL_INTERVAL);
    }, FIRST_POLL_DELAY);

    return () => {
      mountedRef.current = false;
      clearTimeout(firstTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [applicationId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (showCelebration) {
    return <ApprovedCelebration />;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto p-8">
      <div className="flex flex-col items-center text-center space-y-8">
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
            Analizando tu solicitud
          </h1>
          <p className="text-muted-foreground max-w-md">
            Estamos evaluando tus datos. Esto puede tomar unos segundos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '600ms' }} />
        </div>
        <p className="text-xs text-muted-foreground">No cierres esta ventana</p>
      </div>
    </Card>
  );
}
