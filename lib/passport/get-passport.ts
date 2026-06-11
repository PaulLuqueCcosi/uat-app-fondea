import type { PassportSummary, PointsHistoryEntry } from './types';

/**
 * Abstracción de acceso a datos del Pasaporte Financiero.
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

const mockSummary: PassportSummary = {
  currentLevelIndex: 0,
  points: 65,
  levels: [
    { name: 'Bronce', minPoints: 0, maxAmount: 200, color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', image: '/levels/Bronze.png' },
    { name: 'Plata', minPoints: 100, maxAmount: 350, color: 'text-neutral-600', bgColor: 'bg-neutral-50', borderColor: 'border-neutral-300', image: '/levels/Silver.png' },
    { name: 'Oro', minPoints: 250, maxAmount: 600, color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300', image: '/levels/Gold.png' },
    { name: 'Master', minPoints: 500, maxAmount: 1000, color: 'text-primary-700', bgColor: 'bg-primary-50', borderColor: 'border-primary-200', image: '/levels/Master.png' },
  ],
};

const mockHistory: PointsHistoryEntry[] = [
  { id: 'pts-001', description: 'Pago puntual - Cuota 1', points: 15, date: '2026-05-25', type: 'EARNED' },
  { id: 'pts-002', description: 'Referido completado - Carlos M.', points: 15, date: '2026-04-12', type: 'EARNED' },
  { id: 'pts-003', description: 'Referido completado - Ana L.', points: 15, date: '2026-05-23', type: 'EARNED' },
  { id: 'pts-004', description: 'Completar expediente', points: 10, date: '2026-03-15', type: 'EARNED' },
  { id: 'pts-005', description: 'Verificación KYC', points: 10, date: '2026-03-16', type: 'EARNED' },
];

export async function getPassportSummary(): Promise<PassportSummary> {
  return simulateNetwork(mockSummary);
}

export async function getPointsHistory(): Promise<PointsHistoryEntry[]> {
  return simulateNetwork(mockHistory);
}
