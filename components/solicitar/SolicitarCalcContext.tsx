'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { PortalInitialValues } from '@/components/LoanCalculator';

interface SolicitarCalcContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  initialValues?: PortalInitialValues;
  setInitialValues: (values?: PortalInitialValues) => void;
  onRefetch?: () => void;
  setOnRefetch: (callback?: () => void) => void;
}

const SolicitarCalcContext = createContext<SolicitarCalcContextType | undefined>(undefined);

export function SolicitarCalcProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialValues, setInitialValues] = useState<PortalInitialValues | undefined>();
  const [onRefetch, setOnRefetch] = useState<(() => void) | undefined>();

  return (
    <SolicitarCalcContext.Provider
      value={{
        isOpen,
        setIsOpen,
        initialValues,
        setInitialValues,
        onRefetch,
        setOnRefetch,
      }}
    >
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
