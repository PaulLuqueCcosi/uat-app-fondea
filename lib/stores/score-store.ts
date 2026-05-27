import { create } from 'zustand';
import type { PuntajeConfig } from '@/lib/types';
import { getScore } from '@/lib/client-api/score';

// ── Store ─────────────────────────────────────────────────────────────────────
// Puntaje = puntaje del sistema que determina límite de préstamo
// NO es Score Crediticio (eso es diferente — 0 a 1000)

interface PuntajeStore {
  /**
   * Si ya se resolvió la consulta inicial al server.
   * - false → aún no sabemos si tiene puntaje (mostrar skeleton)
   * - true → ya sabemos, `puntaje` refleja la realidad
   */
  isReady: boolean;

  /**
   * El puntaje del usuario — puntaje del sistema.
   * - null → no tiene puntaje disponible
   * - PuntajeConfig → tiene puntaje con puntos y límite de préstamo
   */
  puntaje: PuntajeConfig | null;

  /** Carga el puntaje del server (solo la primera vez) */
  fetchPuntaje: () => Promise<void>;

  /** Fuerza recarga del server (después de cambios) */
  refetch: () => Promise<void>;

  /** Actualiza en memoria sin llamar al server */
  setPuntaje: (data: PuntajeConfig) => void;

  /** Limpia el puntaje */
  clear: () => void;
}

let _fetching = false;

export const usePuntajeStore = create<PuntajeStore>()((set, get) => ({
  isReady: false,
  puntaje: null,

  fetchPuntaje: async () => {
    if (get().isReady || _fetching) return;
    _fetching = true;

    try {
      const data = await getScore();
      set({ puntaje: data, isReady: true });
    } catch (err) {
      console.error('[PuntajeStore] Error fetching:', err);
      set({ isReady: true });
    } finally {
      _fetching = false;
    }
  },

  refetch: async () => {
    _fetching = true;
    try {
      const data = await getScore();
      set({ puntaje: data, isReady: true });
    } catch (err) {
      console.error('[PuntajeStore] Error refetching:', err);
    } finally {
      _fetching = false;
    }
  },

  setPuntaje: (data) => {
    set({ puntaje: data, isReady: true });
  },

  clear: () => {
    set({ puntaje: null, isReady: true });
  },
}));

// Re-export con nombre antiguo para compatibilidad temporal
export const useScoreStore = usePuntajeStore;
