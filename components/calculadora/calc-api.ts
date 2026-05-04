/**
 * Calculadora de Préstamos — API Client (sin auth, endpoints públicos)
 *
 * 1. fetchLoanConfig      → GET  /api/products/{productId}/options
 * 2. fetchLoanCalculation → POST /api/simulate/landing
 * 3. createIntention      → POST /api/intentions
 *
 * Estos endpoints son públicos — no requieren JWT.
 * El flujo post-intención: redirige a /?intencion={uuid} para que el
 * middleware capture el ID y arranque el ciclo de auth normal.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Configuración
// ─────────────────────────────────────────────────────────────────────────────

const PRODUCT_ID    = process.env.NEXT_PUBLIC_PRODUCT_ID         ?? '03d17890-251f-4946-bb91-49d35ff62800';
const BASE_URL      = process.env.NEXT_PUBLIC_BACKEND_API_URL    ?? 'http://localhost:9599/api';
const INTENTIONS_URL = process.env.NEXT_PUBLIC_INTENTIONS_API_URL ?? BASE_URL;

// ─────────────────────────────────────────────────────────────────────────────
// Tipos — Config
// ─────────────────────────────────────────────────────────────────────────────

export interface LoanAmount      { value: number; label: string }
export interface LoanTerm        { value: number; label: string }
export interface LoanInstallment { value: number; label: string }

export interface CreditScoreRange {
  id:           string;
  productId:    string;
  code:         string;
  label:        string;
  color:        string;
  minScore:     number;
  maxScore:     number;
  displayOrder: number;
  isActive:     boolean;
}

export interface LoanConfig {
  productId:         string;
  productName:       string;
  amounts:           LoanAmount[];
  terms:             LoanTerm[];
  installments:      LoanInstallment[];
  creditScoreRanges: CreditScoreRange[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipos — Simulación
// ─────────────────────────────────────────────────────────────────────────────

interface ApiDiscountHistoryItem {
  code:           string;
  name:           string;
  type:           string;
  value:          number;
  amountBefore:   number;
  discountAmount: number;
  amountAfter:    number;
  order:          number;
}

interface ApiFeeItem {
  name:            string;
  type:            string;
  originalAmount:  number;
  discountAmount:  number;
  finalAmount:     number;
  discountHistory: ApiDiscountHistoryItem[];
  config:          { calculationType: string; value: number };
}

interface ApiDiscountItem {
  name:                string;
  type:                string;
  calculationType:     string;
  value:               number;
  totalDiscountAmount: number;
  isFirstLoanOnly:     boolean;
  order:               number;
}

interface ApiSimulation {
  product:          { id: string; name: string };
  principal:        number;
  termDays:         number;
  installmentCount: number;
  isFirstLoan:      boolean;
  fees:             Record<string, ApiFeeItem>;
  discounts:        Record<string, ApiDiscountItem>;
  summary: {
    totalFeesOriginal:                number;
    totalPercentageDiscounts:         number;
    totalFeesWithPercentageDiscounts: number;
    totalFixedDiscounts:              number;
    totalFeesWithFixedDiscounts:      number;
    totalDiscounts:                   number;
    totalFeesResult:                  number;
    totalIgvFromTotalFeesResult:      number;
    totalToPay:                       number;
  };
  schedule: { installmentNo: number; dueDate: string; amount: number }[];
}

interface ApiSimulateItem {
  rangeCode:    string;
  rangeLabel:   string;
  rangeColor:   string;
  minScore:     number;
  maxScore:     number;
  displayOrder: number;
  simulation:   ApiSimulation;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipos internos — usados por los componentes
// ─────────────────────────────────────────────────────────────────────────────

export interface FeeItem {
  key:             string;
  name:            string;
  originalAmount:  number;
  discountAmount:  number;
  finalAmount:     number;
  discountHistory: ApiDiscountHistoryItem[];
}

export interface DiscountItem {
  key:                 string;
  name:                string;
  type:                string;
  calculationType:     string;
  totalDiscountAmount: number;
  order:               number;
}

export interface ScheduleItem {
  installmentNo: number;
  dueDate:       string;
  label:         string;
  amount:        number;
}

export interface ScoreResult {
  code:    string;
  label:   string;
  color:   string;
  lightBg: string;
  total:                            number;
  cuotaAmt:                         number;
  totalFeesOriginal:                number;
  totalPercentageDiscounts:         number;
  totalFeesWithPercentageDiscounts: number;
  totalFixedDiscounts:              number;
  totalFeesWithFixedDiscounts:      number;
  totalDiscounts:                   number;
  totalFeesResult:                  number;
  igv:                              number;
  fees:      FeeItem[];
  discounts: DiscountItem[];
  schedule:  ScheduleItem[];
}

export interface LoanCalculation {
  monto:  number;
  plazo:  number;
  cuotas: number;
  scores: Record<string, ScoreResult>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Colores fijos por perfil (fuente de verdad del frontend)
// ─────────────────────────────────────────────────────────────────────────────

const FIXED_COLORS: Record<number, { color: string; lightBg: string }> = {
  0: { color: '#EF4444', lightBg: 'rgba(239,68,68,0.08)'   }, // bajo  → error-500
  1: { color: '#F59E0B', lightBg: 'rgba(245,158,11,0.08)'  }, // medio → warning-500
  2: { color: '#10B981', lightBg: 'rgba(16,185,129,0.08)'  }, // alto  → success-500
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function hexToLightBg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.08)`;
}

const DAYS   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function formatDueDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${DAYS[d.getDay()]} - ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function mapSimulateItem(item: ApiSimulateItem): ScoreResult {
  const { simulation: sim } = item;

  const fees: FeeItem[] = Object.entries(sim.fees).map(([key, f]) => ({
    key,
    name:            f.name,
    originalAmount:  f.originalAmount,
    discountAmount:  f.discountAmount,
    finalAmount:     f.finalAmount,
    discountHistory: f.discountHistory,
  }));

  const discounts: DiscountItem[] = Object.entries(sim.discounts)
    .map(([key, d]) => ({
      key,
      name:                d.name,
      type:                d.type,
      calculationType:     d.calculationType,
      totalDiscountAmount: d.totalDiscountAmount,
      order:               d.order,
    }))
    .sort((a, b) => a.order - b.order);

  const schedule: ScheduleItem[] = sim.schedule.map((s) => ({
    installmentNo: s.installmentNo,
    dueDate:       s.dueDate,
    label:         formatDueDate(s.dueDate),
    amount:        s.amount,
  }));

  const total    = sim.summary.totalToPay;
  const cuotaAmt = sim.installmentCount > 1
    ? +(total / sim.installmentCount).toFixed(2)
    : total;

  return {
    code:    item.rangeCode,
    label:   item.rangeLabel,
    color:   item.rangeColor,
    lightBg: hexToLightBg(item.rangeColor),
    total,
    cuotaAmt,
    totalFeesOriginal:                sim.summary.totalFeesOriginal,
    totalPercentageDiscounts:         sim.summary.totalPercentageDiscounts,
    totalFeesWithPercentageDiscounts: sim.summary.totalFeesWithPercentageDiscounts,
    totalFixedDiscounts:              sim.summary.totalFixedDiscounts,
    totalFeesWithFixedDiscounts:      sim.summary.totalFeesWithFixedDiscounts,
    totalDiscounts:                   sim.summary.totalDiscounts,
    totalFeesResult:                  sim.summary.totalFeesResult,
    igv:                              sim.summary.totalIgvFromTotalFeesResult,
    fees,
    discounts,
    schedule,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchLoanConfig — GET /api/products/{productId}/options
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchLoanConfig(): Promise<LoanConfig> {
  const url = `${BASE_URL}/products/${PRODUCT_ID}/options`;
  console.log('[CALC_API] fetchLoanConfig → URL:', url);
  console.log('[CALC_API] BASE_URL:', BASE_URL, '| PRODUCT_ID:', PRODUCT_ID);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetchLoanConfig: ${res.status} ${res.statusText} | URL: ${url}`);

  const data = await res.json();
  return {
    productId:    data.product.id,
    productName:  data.product.name,
    amounts:      data.amounts,
    terms:        data.terms,
    installments: data.installments,
    creditScoreRanges: (data.creditScoreRanges as CreditScoreRange[])
      .filter((r) => r.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((range, idx) => ({
        ...range,
        // Sobreescribir color con los fijos del frontend
        color: FIXED_COLORS[idx]?.color ?? range.color,
      })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchLoanCalculation — POST /api/simulate/landing
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchLoanCalculation(
  monto:  number,
  plazo:  number,
  cuotas: number,
  config: LoanConfig,
  signal?: AbortSignal,
): Promise<LoanCalculation> {
  const res = await fetch(`${BASE_URL}/simulate/landing`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      productId:        config.productId,
      amount:           monto,
      termDays:         plazo,
      installmentCount: cuotas,
      isFirstLoan:      true,
    }),
    signal,
  });
  if (!res.ok) throw new Error(`fetchLoanCalculation: ${res.status} ${res.statusText}`);

  const data: ApiSimulateItem[] = await res.json();
  const scores: Record<string, ScoreResult> = {};

  for (const item of data) {
    const key    = item.rangeCode.toLowerCase();
    const mapped = mapSimulateItem(item);
    const idx    = config.creditScoreRanges.findIndex((r) => r.code.toLowerCase() === key);
    const fixed  = FIXED_COLORS[idx];
    // Sobreescribir color y lightBg con los fijos del frontend
    scores[key]  = fixed ? { ...mapped, ...fixed } : mapped;
  }

  return { monto, plazo, cuotas, scores };
}

// ─────────────────────────────────────────────────────────────────────────────
// createIntention — POST /api/intentions  (endpoint público, sin auth)
//
// Igual que en la landing: crea la intención y devuelve el UUID.
// El componente luego redirige a /?intencion={uuid} para que el middleware
// capture el ID y arranque el ciclo de auth normal.
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateIntentionPayload {
  productId:         string;
  amount:            number;
  termDays:          number;
  installmentCount:  number;
  isFirstLoan:       boolean;
  selectedRangeCode?: string;
  metadata?:         ClientMetadata;
}

export interface IntentionResponse {
  id: string;
  [key: string]: unknown;
}

export async function createIntention(
  payload: CreateIntentionPayload,
): Promise<IntentionResponse> {
  const res = await fetch(`${INTENTIONS_URL}/intentions`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createIntention: ${res.status} ${res.statusText}`);
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// collectMetadata — metadatos del cliente para enriquecer la intención
// ─────────────────────────────────────────────────────────────────────────────

const ENABLE_GEOLOCATION = false;
const PAGE_LOAD_TIME     = typeof window !== 'undefined' ? Date.now() : 0;

export interface ClientMetadata {
  timestamp:              string;
  timezone:               string;
  sessionDurationSeconds: number;
  userAgent:              string;
  deviceType:             'mobile' | 'tablet' | 'desktop';
  screenResolution:       string;
  devicePixelRatio:       number;
  language:               string;
  colorScheme:            'dark' | 'light' | 'no-preference';
  connectionType?:        string;
  downlinkMbps?:          number;
  currentUrl:             string;
  referrer:               string | null;
  geolocation?:           { latitude: number; longitude: number; accuracy: number };
  geolocationStatus:      'granted' | 'denied' | 'unavailable' | 'disabled';
}

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent;
  if (/Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return 'mobile';
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (navigator.maxTouchPoints > 1 && /Mac/i.test(ua))) return 'tablet';
  return 'desktop';
}

function getColorScheme(): 'dark' | 'light' | 'no-preference' {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches)  return 'dark';
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'no-preference';
}

function getConnectionInfo(): { type?: string; downlink?: number } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection ?? (navigator as any).mozConnection ?? (navigator as any).webkitConnection;
  if (!conn) return {};
  return {
    type:     conn.effectiveType ?? conn.type ?? undefined,
    downlink: typeof conn.downlink === 'number' ? conn.downlink : undefined,
  };
}

export async function collectMetadata(): Promise<ClientMetadata> {
  const conn = getConnectionInfo();

  let geolocation: ClientMetadata['geolocation'];
  let geolocationStatus: ClientMetadata['geolocationStatus'] = 'disabled';

  if (ENABLE_GEOLOCATION && navigator.geolocation) {
    const coords = await new Promise<ClientMetadata['geolocation']>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        () => resolve(undefined),
        { timeout: 5000, maximumAge: 60_000 },
      );
    });
    if (coords) { geolocation = coords; geolocationStatus = 'granted'; }
    else { geolocationStatus = 'denied'; }
  } else if (ENABLE_GEOLOCATION) {
    geolocationStatus = 'unavailable';
  }

  return {
    timestamp:              new Date().toISOString(),
    timezone:               Intl.DateTimeFormat().resolvedOptions().timeZone,
    sessionDurationSeconds: Math.round((Date.now() - PAGE_LOAD_TIME) / 1000),
    userAgent:              navigator.userAgent,
    deviceType:             getDeviceType(),
    screenResolution:       `${screen.width}x${screen.height}`,
    devicePixelRatio:       window.devicePixelRatio ?? 1,
    language:               navigator.language,
    colorScheme:            getColorScheme(),
    ...(conn.type     && { connectionType: conn.type }),
    ...(conn.downlink !== undefined && { downlinkMbps: conn.downlink }),
    currentUrl: window.location.href,
    referrer:   document.referrer || null,
    ...(geolocation && { geolocation }),
    geolocationStatus,
  };
}
