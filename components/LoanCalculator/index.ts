import './theme.css'

// ── Componente principal (landing — sin auth) ─────────────────────────────────
// Wrapper con Provider de Fondea para la landing
export { default as LoanCalculator } from './LoanCalculatorWithProvider'
// Componente puro sin provider (para otros proyectos que usen su propio provider)
export { LoanCalculator as LoanCalculatorBase } from './ui'

// ── Componente portal (autenticado — crear/editar intención) ──────────────────
export { default as LoanCalculatorPortal } from './LoanCalculatorPortal'
export type { PortalInitialValues } from './LoanCalculatorPortal'
export { LoanCalculatorPortalModal } from './LoanCalculatorPortalModal'

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

// ── Adapters de Fondea (específicos de este proyecto) ─────────────────────────
// NOTA: fondeaApi (landing/Vite) NO se re-exporta aquí porque usa import.meta.env
// que no es compatible con Next.js. Importar directamente si se necesita:
//   import { fondeaApi } from '@/components/LoanCalculator/adapters/fondeaApi'
export { fondeaPortalApi } from './adapters/fondeaPortalApi'
