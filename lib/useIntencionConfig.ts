'use client';

import { useEffect, useState } from 'react';
import { getIntencionConfig } from '@/app/actions/intencion.actions';
import type { IntencionConfig } from './types';

/**
 * Hook que obtiene la configuración del préstamo activo del usuario.
 *
 * Acepta `skip` para diferir la llamada al backend mientras el dispatcher
 * o el orquestador están corriendo (isOrchestrating). Esto evita la race
 * condition donde el sidebar obtiene la intención anterior antes de que
 * registerIntencion() haya terminado de asociar la nueva.
 *
 * Cuando `skip` pasa de true → false (el pathname cambia a un paso real),
 * el efecto se re-ejecuta y obtiene la intención ya registrada.
 */
export function useIntencionConfig(skip = false): {
  config: IntencionConfig | null;
  loading: boolean;
} {
  const [config, setConfig] = useState<IntencionConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (skip) {
      // Mientras orquesta, mantener loading=true y no llamar al backend
      setLoading(true);
      return;
    }

    setLoading(true);
    getIntencionConfig('active')
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

  return { config, loading };
}
