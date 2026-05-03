'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getFunnelRedirect } from '@/app/actions/funnel-orchestrator.actions';
import { saveIntencionId } from '@/lib/intencion';

const MESSAGES = [
  'Verificando tu identidad...',
  'Revisando tu perfil laboral...',
  'Cargando tu información económica...',
  'Preparando tu solicitud...',
];

const MESSAGE_INTERVAL_MS = 1200;

/**
 * Orquestador de pasos del funnel.
 *
 * Recibe el intencionId como query param desde el dispatcher
 * y lo persiste en localStorage de forma síncrona antes de evaluar los pasos.
 * Esto garantiza que el card del sidebar tenga el ID disponible
 * cuando se monte en el paso destino.
 */
export default function SolicitarStartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
    }, MESSAGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Persistir el ID síncronamente antes de evaluar pasos
    const intencionId = searchParams.get('intencion');
    if (intencionId) {
      saveIntencionId(intencionId);
    }

    getFunnelRedirect()
      .then((path) => {
        // Preservar el intencionId en la URL del destino para que el sidebar
        // pueda cargarlo sin depender del timing de registerIntencion
        if (intencionId) {
          const separator = path.includes('?') ? '&' : '?';
          router.replace(`${path}${separator}intencion=${intencionId}`);
        } else {
          router.replace(path);
        }
      })
      .catch(() => router.replace('/solicitar/kyc-validation'));
  }, [router, searchParams]);

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
