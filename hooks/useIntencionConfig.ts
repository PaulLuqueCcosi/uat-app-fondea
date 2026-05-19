'use client';

import { useEffect, useState } from 'react';
import { getActiveIntencion } from '@/lib/client-api/intenciones';
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
  setConfig: (newConfig: IntencionConfig) => void;
} {
  const [config, setConfig] = useState<IntencionConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (skip) {
      setLoading(true);
      return;
    }

    setLoading(true);
    getActiveIntencion()
      .then((data) => {
        setConfig(data ?? null);
      })
      .catch((err) => {
        console.error('[useIntencionConfig] Error:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [skip]);

  return { config, loading, setConfig };
}
