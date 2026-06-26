'use client';

import { createContext, useContext } from 'react';
import type { UserSummary } from '@/modules/profile';

/**
 * Context para compartir datos del usuario entre Layout → Page → Components
 * sin duplicar llamadas HTTP.
 *
 * El Layout carga los datos una vez y los pasa al árbol de componentes.
 */

interface DashboardContextValue {
  summary: UserSummary | null;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  summary,
  children,
}: {
  summary: UserSummary | null;
  children: React.ReactNode;
}) {
  return (
    <DashboardContext.Provider value={{ summary }}>
      {children}
    </DashboardContext.Provider>
  );
}

/**
 * Hook para acceder al summary del usuario.
 * Devuelve null si no hay datos (ej: error al cargar).
 */
export function useDashboardContext(): UserSummary | null {
  const context = useContext(DashboardContext);

  if (context === undefined) {
    throw new Error('useDashboardContext debe usarse dentro de DashboardProvider');
  }

  return context?.summary ?? null;
}
