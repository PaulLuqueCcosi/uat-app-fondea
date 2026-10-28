/**
 * Registro de labels legibles para segmentos dinámicos del breadcrumb (ej. un
 * UUID de crédito en la URL) — la página que carga la entidad registra su
 * código humano (ej. creditCode) y el navbar lo usa en vez del UUID crudo.
 */
import { create } from 'zustand';
import { useEffect, useState } from 'react';

interface BreadcrumbLabelsState {
  labels: Record<string, string>;
  setLabel: (id: string, label: string) => void;
}

export const useBreadcrumbLabelsStore = create<BreadcrumbLabelsState>((set) => ({
  labels: {},
  setLabel: (id, label) =>
    set((state) => (state.labels[id] === label ? state : { labels: { ...state.labels, [id]: label } })),
}));

/** Registra `label` como el texto a mostrar para el segmento `id` en el breadcrumb. */
export function useBreadcrumbLabel(id: string | undefined | null, label: string | undefined | null) {
  const setLabel = useBreadcrumbLabelsStore((s) => s.setLabel);
  useEffect(() => {
    if (id && label) setLabel(id, label);
  }, [id, label, setLabel]);
}

/** Un UUID tal cual viene en la URL: no le dice nada a una persona, así que no se muestra crudo mientras llega su nombre. */
export const isOpaqueSegment = (segment: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);

/**
 * `true` cuando pasó `ms` en esta ruta sin que la página registrara el nombre legible de su segmento dinámico.
 * Mientras no pase, el breadcrumb muestra un marcador de carga en vez del UUID; pasado el plazo, un id corto,
 * para que una página que nunca registra su nombre no se quede cargando para siempre.
 */
export function useBreadcrumbLabelExpired(pathname: string, ms = 8000): boolean {
  const [expiredFor, setExpiredFor] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setExpiredFor(pathname), ms);
    return () => clearTimeout(timer);
  }, [pathname, ms]);
  return expiredFor === pathname;
}
