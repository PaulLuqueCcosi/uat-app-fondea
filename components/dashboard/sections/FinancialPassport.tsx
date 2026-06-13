'use client';

import { PassportFlipBook } from '@/components/passport/PassportFlipBook';
import type { PassportSummary } from '@/modules/passport';

/**
 * Pasaporte Financiero — Sección del dashboard.
 * Muestra el FlipBook directamente.
 *
 * TODO: Recibir datos del servidor (por ahora usa mock inline).
 */

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

export function FinancialPassport() {
  return <PassportFlipBook summary={mockSummary} />;
}
