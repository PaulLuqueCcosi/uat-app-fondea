'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SolicitarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('[ERROR] Solicitar:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-error-50 flex items-center justify-center">
          <span className="text-error-600 text-xl">!</span>
        </div>
        <h2 className="text-lg font-semibold text-neutral-900">
          Error en tu solicitud
        </h2>
        <p className="text-sm text-neutral-600">
          Ocurrió un problema al procesar tu solicitud. Tu progreso está guardado.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
          >
            Reintentar
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Ir al panel
          </button>
        </div>
      </div>
    </div>
  );
}
