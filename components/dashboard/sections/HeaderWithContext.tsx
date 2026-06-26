'use client';

import { useDashboardContext } from '@/lib/contexts/dashboard-context';
import { HeaderActions } from './HeaderActions';
import { DashboardGreeting } from './DashboardGreeting';
import { useIntencionStore } from '@/lib/stores/intencion-store';
import { useEffect } from 'react';

/**
 * Header del dashboard optimizado — lee datos del context (sin duplicar llamadas HTTP).
 * El Layout ya cargó el summary, solo falta cargar la intención activa.
 */
export function HeaderWithContext() {
  const summary = useDashboardContext();
  const { intencion, status, fetch } = useIntencionStore();

  // Cargar intención si no está en el store
  useEffect(() => {
    if (status === 'idle') {
      fetch();
    }
  }, [status, fetch]);

  const name = summary?.name || 'Usuario';
  const subtitle = 'Tienes una solicitud en curso. Continúa donde lo dejaste.';
  const hasActiveIntencion = intencion != null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <DashboardGreeting name={name} subtitle={subtitle} />
      </div>
      <HeaderActions hasActiveIntencion={hasActiveIntencion} />
    </div>
  );
}
