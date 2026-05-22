'use client';

/**
 * Contexto para el panel de edición de la calculadora en el funnel.
 *
 * Solo maneja el UI del panel (abrir/cerrar).
 * La actualización de datos la hace la calculadora directamente al store.
 */

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { PortalInitialValues } from '@/components/LoanCalculator';

interface SolicitarCalcContextType {
  isOpen: boolean;
  openCount: number;
  initialValues?: PortalInitialValues;
  open: (values: PortalInitialValues) => void;
  close: () => void;
}

const SolicitarCalcContext = createContext<SolicitarCalcContextType | undefined>(undefined);

export function SolicitarCalcProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const [initialValues, setInitialValues] = useState<PortalInitialValues | undefined>();

  const open = useCallback((values: PortalInitialValues) => {
    setInitialValues(values);
    setOpenCount(c => c + 1);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <SolicitarCalcContext.Provider value={{ isOpen, openCount, initialValues, open, close }}>
      {children}
    </SolicitarCalcContext.Provider>
  );
}

export function useSolicitarCalc() {
  const context = useContext(SolicitarCalcContext);
  if (!context) {
    throw new Error('useSolicitarCalc debe usarse dentro de SolicitarCalcProvider');
  }
  return context;
}
