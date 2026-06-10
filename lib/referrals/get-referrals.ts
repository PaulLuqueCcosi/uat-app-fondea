import type { Referral, ReferralSummary } from './types';

/**
 * Abstracción de acceso a datos de referidos.
 *
 * HOY: retorna data mock.
 * MAÑANA: reemplazar por fetch al backend real.
 */

const SIMULATED_DELAY_MS = 10;

async function simulateNetwork<T>(data: T): Promise<T> {
  if (process.env.NODE_ENV === 'development') {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));
  }
  return data;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockSummary: ReferralSummary = {
  code: 'MARIO2026',
  link: 'https://fondea.pe/r/MARIO2026',
  totalReferrals: 2,
  completedReferrals: 2,
  totalPointsEarned: 30,
  pointsPerReferral: 15,
};

const mockReferrals: Referral[] = [
  {
    id: 'ref-001',
    name: 'Carlos M.',
    registeredAt: '2026-04-10',
    status: 'COMPLETED',
    pointsEarned: 15,
  },
  {
    id: 'ref-002',
    name: 'Ana L.',
    registeredAt: '2026-05-22',
    status: 'COMPLETED',
    pointsEarned: 15,
  },
];

// ─── Funciones públicas ───────────────────────────────────────────────────────

export async function getReferralSummary(): Promise<ReferralSummary> {
  return simulateNetwork(mockSummary);
}

export async function getReferrals(): Promise<Referral[]> {
  return simulateNetwork(mockReferrals);
}
