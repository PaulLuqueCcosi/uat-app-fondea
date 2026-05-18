// Tipos (contrato)
export type {
  LoanCalculatorApi,
  LoanCalculatorTheme,
  LoanCalculatorProps,
  LoanConfig,
  LoanConfigAmount,
  LoanConfigTerm,
  LoanConfigInstallment,
  CreditScoreRange,
  LoanCalculation,
  ScoreResult,
  ScheduleItem,
  FeeItem,
  DiscountItem,
  IntentionRequest,
  IntentionResponse,
  DetailMode,
  RangeInfo,
  ScoreData,
} from "./types";

// Provider
export { LoanCalculatorProvider, useLoanCalculatorApi, useLoanCalculatorTheme } from "./LoanCalculatorProvider";

// Constantes
export { GAUGE_VALUES, CARD_MAX_WIDTH, DETAIL_MAX_WIDTH, DETAIL_GAP, DETAIL_SIDEBAR_BREAKPOINT } from "./constants";
