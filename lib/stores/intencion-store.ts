import { create } from 'zustand';
import type { IntencionConfig } from '@/lib/types';
import { getActiveIntencion } from '@/app/actions/intencion.actions';
import type { StoreStatus } from './credit-score-store';

// ── Store ─────────────────────────────────────────────────────────────────────

interface IntencionStore {
  status: StoreStatus;
  intencion: IntencionConfig | null;
  error: string | null;

  fetch: () => Promise<void>;
  refetch: () => Promise<void>;
  setIntencion: (data: IntencionConfig) => void;
  clear: () => void;
}

export const useIntencionStore = create<IntencionStore>()((set, get) => ({
  status: 'idle',
  intencion: null,
  error: null,

  fetch: async () => {
    const { status } = get();
    if (status === 'pending' || status === 'success') return;

    set({ status: 'pending', error: null });
    try {
      const result = await getActiveIntencion();
      if (result.ok) {
        set({ status: 'success', intencion: result.data ?? null });
      } else {
        set({ status: 'error', error: result.error.message });
      }
    } catch (err) {
      console.error('[IntencionStore] Error fetching:', err);
      set({ status: 'error', error: 'Error al cargar intención' });
    }
  },

  refetch: async () => {
    set({ status: 'pending', error: null });
    try {
      const result = await getActiveIntencion();
      if (result.ok) {
        set({ status: 'success', intencion: result.data ?? null });
      } else {
        set({ status: 'error', error: result.error.message });
      }
    } catch (err) {
      console.error('[IntencionStore] Error refetching:', err);
      set({ status: 'error', error: 'Error al cargar intención' });
    }
  },

  setIntencion: (data) => {
    set({ status: 'success', intencion: data, error: null });
  },

  clear: () => {
    set({ status: 'idle', intencion: null, error: null });
  },
}));
