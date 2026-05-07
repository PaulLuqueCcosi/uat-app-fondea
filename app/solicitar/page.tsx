'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Calculator } from 'lucide-react';
import { registerIntencion, getActiveIntencion } from '@/lib/client-api/intenciones';
import { Button } from '@/components/ui/button';

type Status = 'resolving' | 'no-intencion' | 'error';

/**
 * Dispatcher del funnel.
 *
 * Caso A: llega con ?intencion=<uuid> (desde la landing)
 *   → registerIntencion() asocia la intención al usuario en el backend
 *   → redirige a /solicitar/start limpio (sin ID en URL)
 *
 * Caso B: sin ID en URL
 *   → getActiveIntencion() busca la intención activa del usuario en el backend
 *   → si existe → /solicitar/start
 *   → si no → muestra aviso para ir a la calculadora
 *
 * El intencionId ya no viaja en la URL más allá de este punto.
 * El sidebar lo obtiene siempre fresco via GET /api/v1/intentions/active.
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
        console.log('[DISPATCHER] Caso A — registrando intención:', intencionIdFromUrl);
        await registerIntencion(intencionIdFromUrl);
        // El backend ya tiene la asociación usuario ↔ intención.
        // No necesitamos pasar el ID en la URL — el orquestador y el sidebar
        // lo obtienen via GET /api/v1/intentions/active.
        router.replace('/solicitar/start');
        return;
      }

      // Caso B: sin ID → verificar si el usuario ya tiene una intención activa
      console.log('[DISPATCHER] Caso B — buscando intención activa...');
      const active = await getActiveIntencion();
      if (active) {
        console.log('[DISPATCHER] Caso B — intención activa encontrada:', active.intencionId);
        router.replace('/solicitar/start');
        return;
      }

      // Caso C: sin intención — mostrar aviso (solo después de resolver)
      console.log('[DISPATCHER] Caso C — sin intención activa');
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
          onClick={() => router.push('/dashboard/calculadora')}
          className="w-full"
        >
          Ir a la calculadora
        </Button>
      </div>
    </div>
  );
}
