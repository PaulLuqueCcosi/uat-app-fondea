/**
 * Tipos para el módulo de Pasaporte Financiero.
 */

export interface PassportLevel {
  name: string;
  minPoints: number;
  maxAmount: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface PassportSummary {
  currentLevelIndex: number;
  points: number;
  levels: PassportLevel[];
}

export interface PointsHistoryEntry {
  id: string;
  description: string;
  points: number;
  date: string;
  type: 'EARNED' | 'REDEEMED';
}
