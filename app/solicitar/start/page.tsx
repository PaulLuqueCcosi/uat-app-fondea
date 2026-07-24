'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getFunnelRedirect } from '@/app/actions/funnel-orchestrator.actions';
import { toast } from 'sonner';

const MESSAGES = [
  'Verificando tu identidad...',
  'Revisando tu perfil laboral...',
  'Cargando tu información económica...',
  'Preparando tu solicitud...',
];

const MESSAGE_INTERVAL_MS = 1500;

/**
 * Orquestador de pasos del funnel.
 *
 * Evalúa en qué paso del funnel está el usuario y redirige.
 * El intencionId ya no viaja en la URL — el sidebar lo obtiene
 * siempre fresco via GET /api/v1/intentions/active.
 */
export default function SolicitarStartPage() {
  const router = useRouter();
  const [messageIndex, setMessageIndex] = useState(0);
  const hasShownToast = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
    }, MESSAGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getFunnelRedirect()
      .then(({ path, allCompleted }) => {
        console.log('[START] redirigiendo a:', path);

        if (allCompleted && !hasShownToast.current) {
          hasShownToast.current = true;
          toast.info('Información completa', {
            description: 'Solo necesitas revisar tu información antes de enviar.',
            duration: 5000,
          });
        }

        router.replace(path);
      })
      .catch(() => router.replace('/solicitar/kyc-validation'));
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 bg-white/80 backdrop-blur-sm border border-primary/10 rounded-2xl px-10 py-8 shadow-sm">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
        <p
          key={messageIndex}
          className="text-sm font-medium text-neutral-700 animate-in fade-in duration-500"
        >
          {MESSAGES[messageIndex]}
        </p>
      </div>
    </div>
  );
}
