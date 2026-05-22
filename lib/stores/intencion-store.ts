import { create } from 'zustand';
import type { IntencionConfig } from '@/lib/types';
import { getActiveIntencion } from '@/lib/client-api/intenciones';

// ── Store ─────────────────────────────────────────────────────────────────────

interface IntencionStore {
  /**
   * Si ya se resolvió la consulta inicial al server.
   * - false → aún no sabemos si tiene intención (mostrar skeleton)
   * - true → ya sabemos, `intencion` refleja la realidad
   */
  isReady: boolean;

  /**
   * La intención activa del usuario.
   * - null → no tiene intención activa
   * - IntencionConfig → tiene una activa con estos datos
   */
  intencion: IntencionConfig | null;

  /** Carga la intención activa del server (solo la primera vez) */
  fetchIntencion: () => Promise<void>;

  /** Fuerza recarga del server (después de crear/editar) */
  refetch: () => Promise<void>;

  /** Actualiza en memoria sin llamar al server */
  setIntencion: (data: IntencionConfig) => void;

  /** Limpia la intención (envío de solicitud, logout, cancelación) */
  clear: () => void;
}

let _fetching = false;

export const useIntencionStore = create<IntencionStore>()((set, get) => ({
  isReady: false,
  intencion: null,

  fetchIntencion: async () => {
    if (get().isReady || _fetching) return;
    _fetching = true;

    try {
      const data = await getActiveIntencion();
      set({ intencion: data, isReady: true });
    } catch (err) {
      console.error('[IntencionStore] Error fetching:', err);
      set({ isReady: true });
    } finally {
      _fetching = false;
    }
  },

  refetch: async () => {
    _fetching = true;
    try {
      const data = await getActiveIntencion();
      set({ intencion: data, isReady: true });
    } catch (err) {
      console.error('[IntencionStore] Error refetching:', err);
    } finally {
      _fetching = false;
    }
  },

  setIntencion: (data) => {
    set({ intencion: data, isReady: true });
  },

  clear: () => {
    set({ intencion: null, isReady: true });
  },
}));
