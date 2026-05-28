import { create } from 'zustand';

// ── Types ──────────────────────────────────────────────────────────────────────

export type StoreStatus = 'idle' | 'pending' | 'success' | 'error';

export interface CreditScoreData {
  score: number; // 0 a 1000
  updatedAt: string; // ISO datetime
}

// ── Store ──────────────────────────────────────────────────────────────────────

interface CreditScoreStore {
  status: StoreStatus;
  creditScore: CreditScoreData | null;
  error: string | null;

  fetch: () => Promise<void>;
  refetch: () => Promise<void>;
  set: (data: CreditScoreData) => void;
  clear: () => void;
}

export const useCreditScoreStore = create<CreditScoreStore>()((set, get) => ({
  status: 'idle',
  creditScore: null,
  error: null,

  fetch: async () => {
    const { status } = get();
    if (status === 'pending' || status === 'success') return;

    set({ status: 'pending', error: null });
    try {
      const res = await window.fetch('/api/credit-score', { cache: 'no-store' });

      if (res.status === 404) {
        set({ status: 'success', creditScore: null });
        return;
      }

      if (!res.ok) {
        set({ status: 'error', error: `HTTP ${res.status}` });
        return;
      }

      const data = await res.json();
      set({ status: 'success', creditScore: data });
    } catch (err) {
      console.error('[CreditScore] Network error:', err);
      set({ status: 'error', error: 'Network error' });
    }
  },

  refetch: async () => {
    set({ status: 'pending', error: null });
    try {
      const res = await window.fetch('/api/credit-score', { cache: 'no-store' });

      if (res.status === 404) {
        set({ status: 'success', creditScore: null });
        return;
      }

      if (!res.ok) {
        set({ status: 'error', error: `HTTP ${res.status}` });
        return;
      }

      const data = await res.json();
      set({ status: 'success', creditScore: data });
    } catch (err) {
      console.error('[CreditScore] Network error:', err);
      set({ status: 'error', error: 'Network error' });
    }
  },

  set: (data) => {
    set({ status: 'success', creditScore: data, error: null });
  },

  clear: () => {
    set({ status: 'idle', creditScore: null, error: null });
  },
}));
