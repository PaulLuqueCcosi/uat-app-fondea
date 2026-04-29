'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getIntencionId, saveIntencionId } from './intencion';

/**
 * Hook para acceder al ID de intención de préstamo en el funnel.
 *
 * Prioridad:
 * 1. Query param `?intencion=ID` (viene de la landing o del redirect post-auth)
 * 2. localStorage (fallback por si el param se perdió en navegación interna)
 *
 * Si encuentra el ID en el query param, lo persiste en localStorage para
 * que esté disponible en pasos posteriores del funnel.
 */
export function useIntencion(): string | null {
  const searchParams = useSearchParams();
  const [intencionId, setIntencionId] = useState<string | null>(null);

  useEffect(() => {
    const fromParam = searchParams.get('intencion');

    if (fromParam) {
      // Persiste para los pasos siguientes del funnel
      saveIntencionId(fromParam);
      setIntencionId(fromParam);
    } else {
      // Fallback: leer desde localStorage
      const fromStorage = getIntencionId();
      setIntencionId(fromStorage);
    }
  }, [searchParams]);

  return intencionId;
}
