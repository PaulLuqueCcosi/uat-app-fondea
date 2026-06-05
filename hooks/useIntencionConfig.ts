'use client';

import { useEffect, useState } from 'react';
import { getActiveIntencion } from '@/app/actions/intencion.actions';
import type { IntencionConfig } from '@/lib/types/intencion';

/**
 * Hook que obtiene la configuración del préstamo activo del usuario.
 *
 * Devuelve `setConfig()` para actualizar los datos directamente desde
 * el panel de calculadora sin necesidad de hacer fetch al backend.
 */
export function useIntencionConfig(skip = false): {
  config: IntencionConfig | null;
  loading: boolean;
  error: string | null;
  setConfig: (newConfig: IntencionConfig) => void;
} {
  const [config, setConfig] = useState<IntencionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (skip) {
      setLoading(true);
      return;
    }

    setLoading(true);
    setError(null);
    getActiveIntencion()
      .then((result) => {
        if (result.ok) {
          setConfig(result.data ?? null);
        } else {
          setError(result.error.message);
        }
      })
      .catch((err) => {
        console.error('[useIntencionConfig] Error:', err);
        setError('Error al cargar intención');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [skip]);

  return { config, loading, error, setConfig };
}
