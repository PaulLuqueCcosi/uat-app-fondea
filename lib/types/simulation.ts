/**
 * Estructura del simulation_snapshot que devuelve
 * GET /api/v1/applications/{id}/detail
 * Es el mismo formato que la respuesta de /api/simulate/landing
 */

export interface SimulationSnapshot {
  product: {
    id: string;
    name: string;
  };
  principal: number;
  termDays: number;
  installmentCount: number;
  isFirstLoan: boolean;
  fees: Record<string, SnapshotFee>;
  discounts: {
    percentage: Record<string, SnapshotDiscount>;
    fixed: Record<string, SnapshotDiscount>;
  };
  summary: SnapshotSummary;
  schedule: SnapshotScheduleItem[];
  requestedAmount: number;
  approvedAmount: number;
  wasLimitAdjusted: boolean;
  scoreLimitAmount: number | null;
  limitNote: string | null;
}

export interface SnapshotFee {
  name: string;
  label: string;
  type: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  discountHistory: SnapshotDiscountHistory[];
  config?: {
    calculationType: string;
    value: number;
  };
}

export interface SnapshotDiscountHistory {
  code: string;
  name: string;
  label: string;
  type: string;
  value: number;
  amountBefore: number;
  discountAmount: number;
  amountAfter: number;
  order: number;
}

export interface SnapshotDiscount {
  name: string;
  label: string;
  type: string;
  calculationType: string;
  value: number;
  totalDiscountAmount: number;
  isFirstLoanOnly: boolean;
  order: number;
}

export interface SnapshotSummary {
  totalFeesOriginal: number;
  totalPercentageDiscounts: number;
  totalFeesWithPercentageDiscounts: number;
  totalFixedDiscounts: number;
  totalFeesWithFixedDiscounts: number;
  totalDiscounts: number;
  totalFeesResult: number;
  totalIgvFromTotalFeesResult: number;
  totalToPay: number;
}

export interface SnapshotScheduleItem {
  installmentNo: number;
  dueDate: string;
  amount: number;
}
