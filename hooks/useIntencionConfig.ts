'use client';

import { useCallback, useEffect, useState } from 'react';
import { getActiveIntencion } from '@/lib/client-api/intenciones';
import type { IntencionConfig } from '@/lib/types/intencion';

/**
 * Hook que obtiene la configuración del préstamo activo del usuario.
 *
 * Devuelve `refetch()` para forzar una recarga (ej: después de editar
 * la intención desde el modal de la calculadora).
 */
export function useIntencionConfig(skip = false): {
  config: IntencionConfig | null;
  loading: boolean;
  refetch: () => void;
} {
  const [config, setConfig] = useState<IntencionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

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
  }, [skip, version]);

  return { config, loading, refetch };
}
