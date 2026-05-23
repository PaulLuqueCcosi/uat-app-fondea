'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Calculator } from 'lucide-react';
import { registerIntencion, getActiveIntencion } from '@/lib/client-api/intenciones';
import { useIntencionStore } from '@/lib/stores/intencion-store';
import { Button } from '@/components/ui/button';

/**
 * Dispatcher del funnel — punto de entrada a /solicitar.
 *
 * Resuelve la intención del usuario y redirige al paso correcto:
 *
 * 1. ¿Viene ?intencion=<uuid>? → registrar en backend → actualizar store → /solicitar/start
 * 2. ¿Ya tiene intención activa? → /solicitar/start
 * 3. ¿Nada? → /dashboard/calculadora (elegir préstamo primero)
 *
 * Después de este punto, el intencionId NO viaja en la URL.
 */
export default function SolicitarDispatcherPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setIntencion = useIntencionStore(s => s.setIntencion);
  const [error, setError] = useState(false);

  useEffect(() => {
    resolve();

    async function resolve() {
      try {
        const intencionId = searchParams.get('intencion');

        // 1. Registrar intención de la landing
        if (intencionId) {
          const result = await registerIntencion(intencionId);
          if (result) {
            setIntencion(result);
            return goToFunnel();
          }
          // ID inválido — fallback a intención activa
        }

        // 2. Buscar intención activa del usuario
        const active = await getActiveIntencion();
        if (active) {
          setIntencion(active);
          return goToFunnel();
        }

        // 3. Sin intención — ir a configurar préstamo
        router.replace('/dashboard/calculadora');
      } catch (err) {
        console.error('[DISPATCHER] Error:', err);
        setError(true);
      }
    }

    function goToFunnel() {
      router.replace('/solicitar/start');
    }
  }, [router, searchParams, setIntencion]);

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-5 bg-white/80 backdrop-blur-sm border border-border rounded-2xl px-10 py-10 shadow-sm max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold text-foreground">
              Algo salió mal
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No pudimos cargar tu solicitud. Intenta desde la calculadora.
            </p>
          </div>
          <Button onClick={() => router.push('/dashboard/calculadora')} className="w-full">
            Ir a la calculadora
          </Button>
        </div>
      </div>
    );
  }

  // ── Loading (estado por defecto) ────────────────────────────────────────────
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
