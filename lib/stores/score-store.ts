import { create } from 'zustand';
import type { PuntajeConfig } from '@/lib/types';
import { getScore } from '@/lib/client-api/score';

// ── Store ─────────────────────────────────────────────────────────────────────
// Score = puntaje del sistema que determina límite de préstamo
// NO es Score Crediticio (eso es diferente)

interface PuntajeStore {
  /**
   * Si ya se resolvió la consulta inicial al server.
   * - false → aún no sabemos si tiene score (mostrar skeleton)
   * - true → ya sabemos, `score` refleja la realidad
   */
  isReady: boolean;

  /**
   * El score del usuario — puntaje del sistema.
   * - null → no tiene score disponible
   * - ScoreConfig → tiene score con puntos y límite de préstamo
   */
  score: PuntajeConfig | null;

  /** Carga el score del server (solo la primera vez) */
  fetchScore: () => Promise<void>;

  /** Fuerza recarga del server (después de cambios) */
  refetch: () => Promise<void>;

  /** Actualiza en memoria sin llamar al server */
  setScore: (data: PuntajeConfig) => void;

  /** Limpia el score */
  clear: () => void;
}

let _fetching = false;

export const useScoreStore = create<PuntajeStore>()((set, get) => ({
  isReady: false,
  score: null,

  fetchScore: async () => {
    if (get().isReady || _fetching) return;
    _fetching = true;

    try {
      const data = await getScore();
      set({ score: data, isReady: true });
    } catch (err) {
      console.error('[ScoreStore] Error fetching:', err);
      set({ isReady: true });
    } finally {
      _fetching = false;
    }
  },

  refetch: async () => {
    _fetching = true;
    try {
      const data = await getScore();
      set({ score: data, isReady: true });
    } catch (err) {
      console.error('[ScoreStore] Error refetching:', err);
    } finally {
      _fetching = false;
    }
  },

  setScore: (data) => {
    set({ score: data, isReady: true });
  },

  clear: () => {
    set({ score: null, isReady: true });
  },
}));
