/**
 * Registro de labels legibles para segmentos dinámicos del breadcrumb (ej. un
 * UUID de crédito en la URL) — la página que carga la entidad registra su
 * código humano (ej. creditCode) y el navbar lo usa en vez del UUID crudo.
 */
import { create } from 'zustand';
import { useEffect } from 'react';

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
