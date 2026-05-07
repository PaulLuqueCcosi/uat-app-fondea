'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ERROR] Dashboard:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-error-50 flex items-center justify-center">
          <span className="text-error-600 text-xl">!</span>
        </div>
        <h2 className="text-lg font-semibold text-neutral-900">
          Error al cargar el panel
        </h2>
        <p className="text-sm text-neutral-600">
          No pudimos cargar esta sección. Verifica tu conexión e inténtalo de nuevo.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
