'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getFunnelRedirect } from '@/app/actions/funnel-orchestrator.actions';

const MESSAGES = [
  'Verificando tu identidad...',
  'Revisando tu perfil laboral...',
  'Cargando tu información económica...',
  'Preparando tu solicitud...',
];

const MESSAGE_INTERVAL_MS = 1200;

/**
 * Orquestador del funnel de solicitud.
 *
 * Muestra mensajes progresivos mientras evalúa el estado de todos los perfiles
 * y redirige al primer paso incompleto (o a /solicitar/summary si todo está listo).
 */
export default function SolicitarPage() {
  const router = useRouter();
  const [messageIndex, setMessageIndex] = useState(0);

  // Rotar mensajes mientras espera
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
    }, MESSAGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Llamar al orquestador y redirigir
  useEffect(() => {
    getFunnelRedirect()
      .then((path) => router.replace(path))
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
