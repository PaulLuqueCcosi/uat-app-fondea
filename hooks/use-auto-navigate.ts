'use client';

import { useState, useEffect, useRef } from 'react';

const DELAY_MS = 4000;

/**
 * Después de guardar exitosamente, muestra la vista verificada durante DELAY_MS
 * y luego navega automáticamente. El usuario puede hacer click en "Continuar"
 * para navegar de inmediato.
 */
export function useAutoNavigate(onNavigate: () => void) {
  const [countdown, setCountdown]     = useState<number | null>(null); // null = inactivo
  const intervalRef                   = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigatedRef                  = useRef(false);

  const start = () => {
    navigatedRef.current = false;
    setCountdown(DELAY_MS / 1000); // empieza en 4
  };

  const navigateNow = () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCountdown(null);
    onNavigate();
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown <= 0) {
      navigateNow();
      return;
    }

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  // Fracción de progreso 0→1 para la barra animada
  const progress = countdown !== null
    ? ((DELAY_MS / 1000 - countdown) / (DELAY_MS / 1000))
    : 0;

  return { start, navigateNow, countdown, progress, active: countdown !== null };
}
