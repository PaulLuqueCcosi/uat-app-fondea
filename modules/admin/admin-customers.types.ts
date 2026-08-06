/**
 * Types para el módulo admin de Customers analytics (M4 / R33-R34).
 */

// ── R33 — Churn Risk ─────────────────────────────────────────────────────────

export type PassportLevel = 'BRONCE' | 'PLATA' | 'ORO' | 'MASTER';

export interface ChurnRiskRow {
  userId: string;
  clientName: string | null;
  clientDocument: string | null;
  passportLevel: PassportLevel | null;
  daysInactive: number;
  lastCreditId: string;
  lastCreditClosedAt: string;
}

export interface ChurnRiskFilters {
  minDaysInactive?: number;
  maxDaysInactive?: number;
}

// ── R34 — Passport Segmentation (raw from proxy, snake_case) ─────────────────

export interface PassportSegmentationLevel {
  level: string;
  client_count: number;
  percentage: number;
  target_percentage: number | null;
}

export interface PassportSegmentationResponse {
  total_active_clients: number;
  levels: PassportSegmentationLevel[];
}
