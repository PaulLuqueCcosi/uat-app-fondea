import { create } from 'zustand';
import type { PuntajeConfig } from '@/lib/types';
import { getScore } from '@/lib/client-api/score';
import type { StoreStatus } from './credit-score-store';

// ── Store ─────────────────────────────────────────────────────────────────────
// Puntaje = puntaje del sistema que determina límite de préstamo
// NO es Score Crediticio (eso es diferente — 0 a 1000)

interface PuntajeStore {
  status: StoreStatus;
  puntaje: PuntajeConfig | null;
  error: string | null;

  fetchPuntaje: () => Promise<void>;
  refetch: () => Promise<void>;
  setPuntaje: (data: PuntajeConfig) => void;
  clear: () => void;
}

export const usePuntajeStore = create<PuntajeStore>()((set, get) => ({
  status: 'idle',
  puntaje: null,
  error: null,

  fetchPuntaje: async () => {
    const { status } = get();
    if (status === 'pending' || status === 'success') return;

    set({ status: 'pending', error: null });
    try {
      const data = await getScore();
      set({ status: 'success', puntaje: data ?? null });
    } catch (err) {
      console.error('[PuntajeStore] Error fetching:', err);
      set({ status: 'error', error: 'Error al cargar puntaje' });
    }
  },

  refetch: async () => {
    set({ status: 'pending', error: null });
    try {
      const data = await getScore();
      set({ status: 'success', puntaje: data ?? null });
    } catch (err) {
      console.error('[PuntajeStore] Error refetching:', err);
      set({ status: 'error', error: 'Error al cargar puntaje' });
    }
  },

  setPuntaje: (data) => {
    set({ status: 'success', puntaje: data, error: null });
  },

  clear: () => {
    set({ status: 'idle', puntaje: null, error: null });
  },
}));

// Re-export con nombre antiguo para compatibilidad temporal
export const useScoreStore = usePuntajeStore;
