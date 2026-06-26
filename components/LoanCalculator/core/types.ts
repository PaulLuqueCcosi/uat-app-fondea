/**
 * Contrato del LoanCalculator
 * Todo lo que se necesita inyectar para usar el componente en cualquier proyecto
 */

// ── Datos que devuelve la API ──────────────────────────────────────────────────

export interface LoanConfigInstallment {
  value: number;
  label: string;
}

export interface LoanConfigTerm {
  value: number;
  label: string;
  installments: LoanConfigInstallment[];
}

export interface LoanConfigAmount {
  value: number;
  label: string;
  terms: LoanConfigTerm[];
}

export interface CreditScoreRange {
  code: string;
  label: string;
  color: string;
}

export interface LoanConfig {
  productId: string;
  amounts: LoanConfigAmount[];
  creditScoreRanges: CreditScoreRange[];
}

export interface ScheduleItem {
  installmentNo: number;
  label: string;
  amount: number;
}

export interface FeeDiscountHistory {
  code: string;
  label: string;
  amountBefore: number;
  discountAmount: number;
  amountAfter: number;
  value: number;
}

export interface FeeItem {
  key: string;
  name: string;
  label: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  discountHistory: FeeDiscountHistory[];
}

export interface DiscountItem {
  key: string;
  name: string;
  label: string;
  type: string;
  calculationType: string;
  totalDiscountAmount: number;
  value: number;
}

export interface ScoreResult {
  total: number;
  cuotaAmt: number;
  color: string;
  lightBg: string;
  fees: FeeItem[];
  discounts: DiscountItem[];
  totalFeesOriginal: number;
  totalFeesWithPercentageDiscounts: number;
  totalPercentageDiscounts: number;
  totalFixedDiscounts: number;
  totalFeesWithFixedDiscounts: number;
  totalFeesResult: number;
  igv: number;
  schedule: ScheduleItem[];
}

export interface LoanCalculation {
  scores: Record<string, ScoreResult>;
}

export interface IntentionRequest {
  productId: string;
  amount: number;
  termDays: number;
  installmentCount: number;
  isFirstLoan: boolean;
  selectedRangeCode?: string;
  metadata?: Record<string, unknown>;
}

export interface IntentionResponse {
  id: string;
}

// ── Contrato de la API (lo que cada proyecto implementa) ───────────────────────

export interface LoanCalculatorApi {
  /** Obtiene la configuración inicial (montos, plazos, cuotas, rangos) */
  fetchConfig: () => Promise<LoanConfig>;
  /** Calcula scores para un monto/plazo/cuotas dado */
  fetchCalculation: (
    amount: number,
    termDays: number,
    installments: number,
    config: LoanConfig,
    signal?: AbortSignal
  ) => Promise<LoanCalculation>;
  /** Crea una intención de préstamo */
  createIntention: (data: IntentionRequest) => Promise<IntentionResponse>;
  /** URL del portal donde redirigir después de crear la intención */
  portalUrl: string;
  /** Recolecta metadata del dispositivo (opcional) */
  collectMetadata?: () => Promise<Record<string, unknown>>;
}

// ── Tema de colores (inyectable via CSS vars o config) ─────────────────────────

export interface LoanCalculatorTheme {
  /** Color primario (botones, slider, links) */
  primary: string;
  /** Color primario oscuro (hover) */
  primaryDark: string;
  /** Color primario claro (fondos) */
  primaryLight: string;
  /** Color de texto principal */
  text: string;
  /** Color de texto secundario/muted */
  muted: string;
  /** Color de borde */
  border: string;
  /** Color de fondo */
  background: string;
  /** Color del header del detalle */
  headerBg: string;
  /** Color del texto del header */
  headerText: string;
}

// ── Props del componente principal ─────────────────────────────────────────────

export type DetailMode = "sidebar" | "modal";

/** Valores iniciales para pre-llenar la calculadora (modo edición) */
export interface InitialSelection {
  amount?: number;
  termDays?: number;
  installmentCount?: number;
}

export interface LoanCalculatorProps {
  /** Callback cuando el panel de detalles se abre/cierra */
  onDetailToggle?: (isOpen: boolean) => void;
  /** Modo de visualización de detalles */
  detailMode?: DetailMode;
  /** Página dedicada a la calculadora (más padding) */
  dedicated?: boolean;
  /** Texto del botón de acción */
  submitLabel?: string;
  /** Valores iniciales para pre-llenar monto/plazo/cuotas (modo edición) */
  initialSelection?: InitialSelection;
  /** Clase CSS adicional */
  className?: string;
  /** Ancho máximo del panel de detalle en px (default: 380) */
  detailMaxWidth?: number;
  /** Monto máximo permitido — si el monto seleccionado lo supera, muestra warning y deshabilita submit */
  maxAmount?: number | null;
}

// ── Info para componentes internos ─────────────────────────────────────────────

export interface RangeInfo {
  code: string;
  label: string;
  color: string;
}

export interface ScoreData {
  total: number;
}
