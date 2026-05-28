'use client';

import { useEffect } from 'react';
import { useIntencionStore } from '@/lib/stores/intencion-store';
import { usePuntajeStore } from '@/lib/stores/score-store';
import { useCreditScoreStore } from '@/lib/stores/credit-score-store';

/**
 * Componente invisible que inicializa todos los stores del dashboard
 * en un solo punto, al montar. Esto evita que cada componente individual
 * tenga que disparar su propio fetch y garantiza que los datos estén
 * disponibles lo antes posible.
 *
 * Se monta una vez en el layout/page del dashboard.
 */
export function DashboardStoreInit() {
  const fetchIntencion = useIntencionStore(s => s.fetch);
  const fetchPuntaje = usePuntajeStore(s => s.fetchPuntaje);
  const fetchCreditScore = useCreditScoreStore(s => s.fetch);

  useEffect(() => {
    // Disparar todos los fetches en paralelo al montar
    fetchIntencion();
    fetchPuntaje();
    fetchCreditScore();
  }, [fetchIntencion, fetchPuntaje, fetchCreditScore]);

  return null; // No renderiza nada
}
