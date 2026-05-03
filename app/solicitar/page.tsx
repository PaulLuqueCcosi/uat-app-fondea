'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Calculator } from 'lucide-react';
import { registerIntencion, getActiveIntencion } from '@/app/actions/intencion.actions';
import { saveIntencionId } from '@/lib/intencion';
import { Button } from '@/components/ui/button';

type Status = 'resolving' | 'no-intencion' | 'error';

/**
 * Dispatcher del funnel.
 *
 * Estado inicial siempre 'resolving' — nunca muestra el aviso de error
 * antes de que termine la resolución async. Esto evita el flash/race condition
 * en la primera visita sin intención.
 */
export default function SolicitarDispatcherPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('resolving');

  useEffect(() => {
    const intencionIdFromUrl = searchParams.get('intencion');

    async function resolve() {
      // Caso A: viene de la landing con ID en la URL
      if (intencionIdFromUrl) {
        saveIntencionId(intencionIdFromUrl);
        await registerIntencion(intencionIdFromUrl);
        // Pasar el ID como param para que /start lo tenga disponible
        // sin depender del timing de localStorage
        router.replace(`/solicitar/start?intencion=${intencionIdFromUrl}`);
        return;
      }

      // Caso B: sin ID → buscar intención activa del usuario en el backend
      const active = await getActiveIntencion();
      if (active) {
        saveIntencionId(active.intencionId);
        router.replace(`/solicitar/start?intencion=${active.intencionId}`);
        return;
      }

      // Caso C: sin intención — mostrar aviso (solo después de resolver)
      setStatus('no-intencion');
    }

    resolve().catch((err) => {
      console.error('[DISPATCHER] Error al resolver intención:', err);
      setStatus('error');
    });
  }, [router, searchParams]);

  // Loader mientras resuelve (estado inicial — nunca hay flash)
  if (status === 'resolving') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 bg-white/80 backdrop-blur-sm border border-primary/10 rounded-2xl px-10 py-8 shadow-sm">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
          <p className="text-sm font-medium text-neutral-700">
            Preparando tu solicitud...
          </p>
        </div>
      </div>
    );
  }

  // Sin intención o error — mismo aviso con mensaje adaptado
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-5 bg-white/80 backdrop-blur-sm border border-border rounded-2xl px-10 py-10 shadow-sm max-w-sm text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Calculator className="w-6 h-6 text-primary" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold text-foreground">
            Primero elige tu préstamo
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {status === 'error'
              ? 'Ocurrió un error al cargar tu solicitud. Intenta desde la calculadora.'
              : 'Para continuar necesitas seleccionar el monto y plazo de tu préstamo.'}
          </p>
        </div>
        <Button
          onClick={() => router.push('/solicitar/calculadora')}
          className="w-full"
        >
          Ir a la calculadora
        </Button>
      </div>
    </div>
  );
}
