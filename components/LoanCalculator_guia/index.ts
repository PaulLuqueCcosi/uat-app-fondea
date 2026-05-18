import './theme.css'

// ── Componente principal ──────────────────────────────────────────────────────
// Wrapper con Provider de Fondea (para este proyecto)
export { default as LoanCalculator } from './LoanCalculatorWithProvider'
// Componente puro sin provider (para otros proyectos que usen su propio provider)
export { LoanCalculator as LoanCalculatorBase } from './ui'

// ── Core: Provider, tipos, constantes ─────────────────────────────────────────
export {
  LoanCalculatorProvider,
  useLoanCalculatorApi,
} from './core'

export type {
  LoanCalculatorApi,
  LoanCalculatorTheme,
  LoanCalculatorProps,
  DetailMode,
  LoanConfig,
  LoanCalculation,
  ScoreResult,
  RangeInfo,
  ScoreData,
} from './core'

export {
  CARD_MAX_WIDTH,
  DETAIL_MAX_WIDTH,
  DETAIL_GAP,
  DETAIL_SIDEBAR_BREAKPOINT,
} from './core'

// ── Adapter de Fondea (específico de este proyecto) ───────────────────────────
export { fondeaApi } from './adapters'
