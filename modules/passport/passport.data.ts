/**
 * Mock data para el módulo Pasaporte Financiero.
 *
 * TEMPORAL — se eliminará cuando exista el endpoint real.
 *
 * Cada nivel tiene un rango de puntos y un límite de crédito.
 * Los metadatos visuales (colores, imagen) son configurables.
 */

import type { PassportLevel, PointsHistoryEntry } from './passport.types';

// ── Niveles con rangos de puntos ──────────────────────────────────────────────

export const mockLevels: PassportLevel[] = [
  {
    name: 'Bronce',
    minPoints: 0,
    maxPoints: 99,
    maxLoanAmount: 200,
    currency: 'PEN',
    meta: {
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      image: '/levels/Bronze.png',
    },
  },
  {
    name: 'Plata',
    minPoints: 100,
    maxPoints: 249,
    maxLoanAmount: 350,
    currency: 'PEN',
    meta: {
      color: 'text-neutral-600',
      bgColor: 'bg-neutral-50',
      borderColor: 'border-neutral-300',
      image: '/levels/Silver.png',
    },
  },
  {
    name: 'Oro',
    minPoints: 250,
    maxPoints: 499,
    maxLoanAmount: 600,
    currency: 'PEN',
    meta: {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
      image: '/levels/Gold.png',
    },
  },
  {
    name: 'Master',
    minPoints: 500,
    maxPoints: null, // Sin tope
    maxLoanAmount: 1000,
    currency: 'PEN',
    meta: {
      color: 'text-primary-700',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      image: '/levels/Master.png',
    },
  },
];

// ── Puntos del usuario ────────────────────────────────────────────────────────

export const mockUserPoints = 65;

// ── Historial de movimientos ──────────────────────────────────────────────────

export const mockHistory: PointsHistoryEntry[] = [
  { id: 'pts-001', description: 'Pago puntual - Cuota 1', points: 15, date: '2026-05-25', type: 'EARNED' },
  { id: 'pts-002', description: 'Referido completado - Carlos M.', points: 15, date: '2026-04-12', type: 'EARNED' },
  { id: 'pts-003', description: 'Referido completado - Ana L.', points: 15, date: '2026-05-23', type: 'EARNED' },
  { id: 'pts-004', description: 'Completar expediente', points: 10, date: '2026-03-15', type: 'EARNED' },
  { id: 'pts-005', description: 'Verificación KYC', points: 10, date: '2026-03-16', type: 'EARNED' },
];
