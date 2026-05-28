'use client';

import { useEffect } from 'react';
import { useIntencionStore } from '@/lib/stores/intencion-store';

export function HeaderSubtitle() {
  const status = useIntencionStore(s => s.status);
  const intencion = useIntencionStore(s => s.intencion);
  const fetchIntencion = useIntencionStore(s => s.fetch);

  useEffect(() => {
    fetchIntencion();
  }, [fetchIntencion]);

  if (status === 'idle' || status === 'pending') {
    return (
      <p className="text-sm sm:text-base text-fondea-text">
        Cargando tu información...
      </p>
    );
  }

  return (
    <p className="text-sm sm:text-base text-fondea-text">
      {intencion
        ? 'Tienes una solicitud en curso. Continúa donde lo dejaste.'
        : 'Completa tu expediente para solicitar tu primer préstamo'}
    </p>
  );
}
