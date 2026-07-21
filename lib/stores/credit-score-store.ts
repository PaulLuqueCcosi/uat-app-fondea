import { create } from 'zustand';
import type { ScoreRange } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────────────────────────

export type StoreStatus = 'idle' | 'pending' | 'success' | 'error';

export interface CreditScoreData {
  score: number;        // Score del buró (300-999)
  updatedAt: string;    // ISO datetime de la última consulta
  classification: string | null;  // NORMAL, CPP, DEFICIENTE, etc.
  isValid: boolean;     // Si el reporte no está expirado
  provider: string;     // SENTINEL, EXPERIAN, MOCK
}

// ── Store ──────────────────────────────────────────────────────────────────────

interface CreditScoreStore {
  status: StoreStatus;
  creditScore: CreditScoreData | null;
  error: string | null;

  // Rangos del producto (configuración estática, cachea 1 vez)
  rangesStatus: StoreStatus;
  scoreRanges: ScoreRange[] | null;
  rangesError: string | null;

  fetch: () => Promise<void>;
  refetch: () => Promise<void>;
  set: (data: CreditScoreData) => void;
  clear: () => void;

  fetchScoreRanges: () => Promise<void>;
}

export const useCreditScoreStore = create<CreditScoreStore>()((set, get) => ({
  status: 'idle',
  creditScore: null,
  error: null,

  rangesStatus: 'idle',
  scoreRanges: null,
  rangesError: null,

  fetch: async () => {
    const { status } = get();
    if (status === 'pending' || status === 'success') return;

    set({ status: 'pending', error: null });
    try {
      const res = await window.fetch('/api/buro/me', { cache: 'no-store' });

      if (res.status === 404) {
        // Sin reporte del buró aún
        set({ status: 'success', creditScore: null });
        return;
      }

      if (!res.ok) {
        set({ status: 'error', error: `HTTP ${res.status}` });
        return;
      }

      const data = await res.json();
      // Mapear respuesta del buró al formato del store
      set({
        status: 'success',
        creditScore: {
          score: data.buro_score ?? 0,
          updatedAt: data.consulted_at ?? new Date().toISOString(),
          classification: data.worst_classification ?? null,
          isValid: data.is_valid ?? false,
          provider: data.provider ?? 'MOCK',
        },
      });
    } catch (err) {
      console.error('[CreditScore] Network error:', err);
      set({ status: 'error', error: 'Network error' });
    }
  },

  refetch: async () => {
    set({ status: 'pending', error: null });
    try {
      const res = await window.fetch('/api/buro/me', { cache: 'no-store' });

      if (res.status === 404) {
        set({ status: 'success', creditScore: null });
        return;
      }

      if (!res.ok) {
        set({ status: 'error', error: `HTTP ${res.status}` });
        return;
      }

      const data = await res.json();
      set({
        status: 'success',
        creditScore: {
          score: data.buro_score ?? 0,
          updatedAt: data.consulted_at ?? new Date().toISOString(),
          classification: data.worst_classification ?? null,
          isValid: data.is_valid ?? false,
          provider: data.provider ?? 'MOCK',
        },
      });
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

  fetchScoreRanges: async () => {
    const { rangesStatus } = get();
    if (rangesStatus === 'pending' || rangesStatus === 'success') return;

    set({ rangesStatus: 'pending', rangesError: null });
    try {
      const res = await window.fetch('/api/calculadora/score-ranges', { cache: 'no-store' });

      if (!res.ok) {
        set({ rangesStatus: 'error', rangesError: `HTTP ${res.status}` });
        return;
      }

      const data = await res.json();
      const ranges: ScoreRange[] | undefined = data.scoreRanges;

      if (ranges && ranges.length > 0) {
        set({ rangesStatus: 'success', scoreRanges: ranges });
      } else {
        set({ rangesStatus: 'success', scoreRanges: null });
      }
    } catch (err) {
      console.error('[CreditScore] Error fetching ranges:', err);
      set({ rangesStatus: 'error', rangesError: 'Network error' });
    }
  },
}));
