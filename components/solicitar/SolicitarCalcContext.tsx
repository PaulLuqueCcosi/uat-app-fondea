'use client';

/**
 * Contexto para el panel de edición de la calculadora en el funnel de solicitud.
 *
 * Flujo:
 * 1. SummaryCard llama a `open(initialValues, onSuccess)` → abre el panel
 * 2. Panel muestra la calculadora pre-llenada con `initialValues`
 * 3. Usuario edita y guarda → Panel llama `handleSuccess(updatedConfig)`
 * 4. handleSuccess cierra el panel y ejecuta el callback `onSuccess`
 *    que actualiza el estado del SummaryCard sin refetch
 *
 * El callback se guarda en un ref para evitar re-renders innecesarios.
 */

import { createContext, useContext, useState, useRef, ReactNode, useCallback } from 'react';
import type { PortalInitialValues } from '@/components/LoanCalculator';
import type { IntencionConfig } from '@/lib/types/intencion';

interface SolicitarCalcContextType {
  /** Si el panel de edición está abierto */
  isOpen: boolean;
  /** Contador de aperturas — se usa como key para forzar remount limpio */
  openCount: number;
  /** Abre el panel con valores iniciales y un callback para recibir el resultado */
  open: (values: PortalInitialValues, onSuccess: (data: IntencionConfig) => void) => void;
  /** Cierra el panel sin ejecutar el callback */
  close: () => void;
  /** Valores iniciales para pre-llenar la calculadora */
  initialValues?: PortalInitialValues;
  /** Cierra el panel y ejecuta el callback con la data actualizada */
  handleSuccess: (data: IntencionConfig) => void;
}

const SolicitarCalcContext = createContext<SolicitarCalcContextType | undefined>(undefined);

export function SolicitarCalcProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const [initialValues, setInitialValues] = useState<PortalInitialValues | undefined>();
  const onSuccessRef = useRef<((data: IntencionConfig) => void) | null>(null);

  const open = useCallback((values: PortalInitialValues, onSuccess: (data: IntencionConfig) => void) => {
    setInitialValues(values);
    onSuccessRef.current = onSuccess;
    setOpenCount(c => c + 1);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSuccess = useCallback((data: IntencionConfig) => {
    setIsOpen(false);
    onSuccessRef.current?.(data);
  }, []);

  return (
    <SolicitarCalcContext.Provider
      value={{ isOpen, openCount, open, close, initialValues, handleSuccess }}
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
