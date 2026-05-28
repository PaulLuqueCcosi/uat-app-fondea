'use client';

/**
 * ⚠️ TEMPORAL — BORRAR DESPUÉS DE PROBAR ⚠️
 *
 * Componente de debug que captura errores DOM (insertBefore, removeChild)
 * y loguea información útil para diagnosticar race conditions de React.
 */

import { useEffect } from 'react';
import { useIntencionStore } from '@/lib/stores/intencion-store';

export function DOMErrorLogger() {
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      const msg = event.message || '';
      if (
        msg.includes('insertBefore') ||
        msg.includes('removeChild') ||
        msg.includes('appendChild')
      ) {
        console.error('🚨 [DOMErrorLogger] DOM manipulation error caught!');
        console.error('  Message:', msg);
        console.error('  Source:', event.filename, 'line:', event.lineno);
        console.error('  Timestamp:', new Date().toISOString());

        // Loguear el estado actual del intencion-store
        try {
          const state = useIntencionStore.getState();
          console.error('  IntencionStore state:', {
            status: state.status,
            hasIntencion: !!state.intencion,
            intencionId: state.intencion?.intencionId ?? 'null',
          });
        } catch {
          // Ignorar si no se puede acceder
        }

        // Loguear qué paneles están visibles
        const panels = document.querySelectorAll('[data-calc-panel]');
        console.error('  Calc panels in DOM:', panels.length);
        panels.forEach((p, i) => {
          console.error(`    Panel ${i}:`, {
            visible: !p.classList.contains('opacity-0'),
            id: p.getAttribute('data-calc-panel'),
          });
        });
      }
    };

    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  return null;
}
