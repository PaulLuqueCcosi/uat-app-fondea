'use client';

/**
 * Contexto compartido entre SolicitudView y SolicitudesSidebar.
 *
 * SolicitudView es el único que hace polling y carga datos.
 * Cuando tiene el resultado, lo publica aquí para que el sidebar lo consuma.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { ApplicationRecord } from '@/lib/types';
import type { ApplicationFullDetail } from '@/app/actions/application.actions';

interface SolicitudContextType {
  /** Application completo (con status, creditScore, etc.) */
  application: ApplicationRecord | null;
  /** Detalle financiero (monto, cuotas, cronograma) */
  fullDetail: ApplicationFullDetail | null;
  /** Si los datos ya están disponibles (polling terminó) */
  isReady: boolean;
  /** SolicitudView llama esto cuando tiene los datos */
  setData: (app: ApplicationRecord, detail: ApplicationFullDetail | null) => void;
}

const SolicitudContext = createContext<SolicitudContextType | undefined>(undefined);

export function SolicitudProvider({ children }: { children: ReactNode }) {
  const [application, setApplication] = useState<ApplicationRecord | null>(null);
  const [fullDetail, setFullDetail] = useState<ApplicationFullDetail | null>(null);
  const [isReady, setIsReady] = useState(false);

  const setData = useCallback((app: ApplicationRecord, detail: ApplicationFullDetail | null) => {
    setApplication(app);
    setFullDetail(detail);
    setIsReady(true);
  }, []);

  return (
    <SolicitudContext.Provider value={{ application, fullDetail, isReady, setData }}>
      {children}
    </SolicitudContext.Provider>
  );
}

export function useSolicitudData() {
  const context = useContext(SolicitudContext);
  if (!context) {
    throw new Error('useSolicitudData debe usarse dentro de SolicitudProvider');
  }
  return context;
}
