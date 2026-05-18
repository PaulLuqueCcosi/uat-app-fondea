import { useRef, useState, useEffect } from 'react';

/**
 * Hook que mide el ancho del contenedor en tiempo real usando ResizeObserver.
 * Permite que los componentes se adapten dinámicamente al espacio disponible.
 *
 * @param debounceMs - Tiempo de debounce en ms (default: 150ms)
 * @returns { ref, width } - Referencia para el contenedor y ancho actual
 *
 * @example
 * const { ref, width } = useContainerWidth();
 * const isSidebar = width >= 751;
 * return (
 *   <div ref={ref}>
 *     {isSidebar ? <Sidebar /> : <Modal />}
 *   </div>
 * );
 */
export function useContainerWidth(debounceMs = 150) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!ref.current) return;

    const ro = new ResizeObserver(([entry]) => {
      // Debounce: esperar antes de actualizar para evitar re-renders excesivos
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setWidth(Math.round(entry.contentRect.width));
      }, debounceMs);
    });

    ro.observe(ref.current);

    return () => {
      ro.disconnect();
      clearTimeout(timeoutRef.current);
    };
  }, [debounceMs]);

  return { ref, width };
}
