import { create } from 'zustand';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CreditScoreData {
  score: number; // 0 a 1000
  updatedAt: string; // ISO datetime
}

// ── Store ──────────────────────────────────────────────────────────────────────
// Credit Score = score crediticio del usuario (0-1000)
// Se recarga después de submit y cuando llega el resultado de la solicitud

interface CreditScoreStore {
  /**
   * Si ya se resolvió la consulta inicial al server.
   * - false → aún no sabemos si tiene score crediticio (mostrar skeleton)
   * - true → ya sabemos, `creditScore` refleja la realidad
   */
  isReady: boolean;

  /**
   * El score crediticio del usuario (0-1000).
   * - null → no tiene score crediticio disponible (404 del backend)
   * - CreditScoreData → tiene score con valor y fecha de actualización
   */
  creditScore: CreditScoreData | null;

  /** Carga el score crediticio del server (solo la primera vez) */
  fetchCreditScore: () => Promise<void>;

  /** Fuerza recarga del server (después de submit o resultado) */
  refetch: () => Promise<void>;

  /** Actualiza en memoria sin llamar al server */
  setCreditScore: (data: CreditScoreData) => void;

  /** Limpia el score crediticio */
  clear: () => void;
}

let _fetching = false;

export const useCreditScoreStore = create<CreditScoreStore>()((set, get) => ({
  isReady: false,
  creditScore: null,

  fetchCreditScore: async () => {
    if (get().isReady || _fetching) return;
    _fetching = true;

    try {
      const res = await fetch('/api/credit-score', { cache: 'no-store' });
      
      if (res.status === 404) {
        console.log('[CreditScoreStore] 404: sin score crediticio');
        set({ creditScore: null, isReady: true });
        return;
      }

      if (!res.ok) {
        console.error('[CreditScoreStore] Error:', res.status);
        set({ isReady: true });
        return;
      }

      const data = await res.json();
      console.log('[CreditScoreStore] ✅ score cargado:', data.score);
      set({ creditScore: data, isReady: true });
    } catch (err) {
      console.error('[CreditScoreStore] Network error:', err);
      set({ isReady: true });
    } finally {
      _fetching = false;
    }
  },

  refetch: async () => {
    _fetching = true;
    try {
      const res = await fetch('/api/credit-score', { cache: 'no-store' });
      
      if (res.status === 404) {
        console.log('[CreditScoreStore] 404: sin score crediticio');
        set({ creditScore: null, isReady: true });
        return;
      }

      if (!res.ok) {
        console.error('[CreditScoreStore] Error:', res.status);
        return;
      }

      const data = await res.json();
      console.log('[CreditScoreStore] ✅ score recargado:', data.score);
      set({ creditScore: data, isReady: true });
    } catch (err) {
      console.error('[CreditScoreStore] Network error:', err);
    } finally {
      _fetching = false;
    }
  },

  setCreditScore: (data) => {
    set({ creditScore: data, isReady: true });
  },

  clear: () => {
    set({ creditScore: null, isReady: true });
  },
}));
