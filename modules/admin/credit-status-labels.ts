/**
 * Estados de crédito y cuota para las vistas de ADMIN — tipos + etiquetas.
 *
 * <p>Espejo de los enums `CreditStatus.java` e `InstallmentStatus.java`. Este archivo es
 * la fuente canónica: `mock-data.ts`, `admin-credits.service.ts` y
 * `admin-credit-detail.service.ts` reexportan estos tipos en vez de redeclararlos (antes
 * cada uno tenía su propia copia y ya habían divergido).
 *
 * <p>A diferencia de `modules/credits/installment-view-status.ts` (que traduce el estado a
 * lo que le conviene ver al CLIENTE, ocultando el vencimiento cuando hay un comprobante en
 * revisión), acá se muestra el estado CONTABLE tal cual: el admin necesita la realidad del
 * crédito para cobranza y reportes.
 *
 * <p><b>Por qué está centralizado:</b> estos Records estaban duplicados en cinco vistas de
 * admin, tipados como `Record<string, ...>`. Con `string` como clave, si el backend agrega
 * un estado al enum nada rompe la compilación — la UI simplemente muestra el código crudo
 * (`WRITTEN_OFF` en vez de "Castigado"). Tipados con el enum, TypeScript obliga a cubrir
 * todos los casos.
 */

// ─── Tipos (espejo de los enums del backend) ──────────────────────────────────

/** Espejo exacto de `CreditStatus.java`. */
export type CreditStatus =
  | 'PENDING_DISBURSEMENT'
  | 'ACTIVE'
  | 'OVERDUE'
  | 'SUSPENDED'
  | 'WRITTEN_OFF'
  | 'PAID_OFF';

/** Espejo exacto de `InstallmentStatus.java`. */
export type InstallmentStatus =
  | 'PENDING'
  | 'CURRENT'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'NEGOTIATED';

/** Variantes del componente Badge de shadcn. */
export type AdminBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

// ─── Crédito ──────────────────────────────────────────────────────────────────

export interface CreditStatusInfo {
  label: string;
  variant: AdminBadgeVariant;
  /** Qué significa el estado — para tooltips y vistas de detalle. */
  description: string;
  /**
   * Clases Tailwind para chips inline en tablas densas, donde el Badge de shadcn es
   * demasiado grande. Usa los tokens de la paleta (no colores arbitrarios) y respeta el
   * mínimo de contraste 4.5:1 de la guía: texto 700+ sobre fondos 50–100.
   */
  chipClass: string;
  /** Color sólido para barras de progreso e indicadores. */
  dotClass: string;
}

export const CREDIT_STATUS_INFO: Record<CreditStatus, CreditStatusInfo> = {
  PENDING_DISBURSEMENT: {
    label: 'Por desembolsar',
    variant: 'outline',
    description: 'El crédito existe pero el dinero todavía no salió. No acumula mora ni recibe pagos.',
    chipClass: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    dotClass: 'bg-neutral-400',
  },
  ACTIVE: {
    label: 'Activo',
    variant: 'default',
    description: 'Desembolsado y al día — sin cuotas vencidas.',
    chipClass: 'bg-success-50 text-success-700 border-success-100',
    dotClass: 'bg-success-500',
  },
  OVERDUE: {
    label: 'Vencido',
    variant: 'secondary',
    description: 'Tiene al menos una cuota vencida acumulando mora.',
    chipClass: 'bg-warning-50 text-warning-700 border-warning-100',
    dotClass: 'bg-warning-500',
  },
  SUSPENDED: {
    label: 'Suspendido',
    variant: 'secondary',
    description: 'Congelado por decisión administrativa (fraude, disputa, orden judicial). No acumula mora ni acepta pagos hasta reactivarlo.',
    chipClass: 'bg-warning-100 text-warning-900 border-warning-400',
    dotClass: 'bg-warning-700',
  },
  WRITTEN_OFF: {
    label: 'Castigado',
    variant: 'destructive',
    description: 'Pérdida reconocida contablemente. Puede recuperarse si el cliente paga voluntariamente.',
    chipClass: 'bg-error-50 text-error-700 border-error-100',
    dotClass: 'bg-error-600',
  },
  PAID_OFF: {
    label: 'Liquidado',
    variant: 'outline',
    description: 'Todas las cuotas resueltas — pagadas directamente o vía refinanciamiento.',
    chipClass: 'bg-primary-50 text-primary-700 border-primary-200',
    dotClass: 'bg-primary-500',
  },
};

/** Orden de presentación para selects de filtro. */
export const CREDIT_STATUS_ORDER: CreditStatus[] = [
  'PENDING_DISBURSEMENT',
  'ACTIVE',
  'OVERDUE',
  'SUSPENDED',
  'WRITTEN_OFF',
  'PAID_OFF',
];

// ─── Cuota ────────────────────────────────────────────────────────────────────

export interface InstallmentStatusInfo {
  label: string;
  variant: AdminBadgeVariant;
  description: string;
}

export const INSTALLMENT_STATUS_INFO: Record<InstallmentStatus, InstallmentStatusInfo> = {
  PENDING: {
    label: 'Pendiente',
    variant: 'outline',
    description: 'Todavía no llegó su fecha de vencimiento.',
  },
  CURRENT: {
    label: 'Por pagar',
    variant: 'default',
    description: 'Es la cuota en curso — ya es exigible y aún no vence.',
  },
  PARTIALLY_PAID: {
    label: 'Pago parcial',
    variant: 'secondary',
    description: 'Recibió pagos pero no está saldada.',
  },
  PAID: {
    label: 'Pagada',
    variant: 'default',
    description: 'Saldada por completo, incluyendo mora si tenía.',
  },
  OVERDUE: {
    label: 'Vencida',
    variant: 'destructive',
    description: 'Pasó su fecha de vencimiento sin completar el pago. Acumula mora.',
  },
  NEGOTIATED: {
    label: 'Refinanciada',
    variant: 'secondary',
    description: 'Su deuda se trasladó a un crédito de refinanciamiento. Ya no se cobra desde acá.',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const UNKNOWN_CREDIT_STATUS = (status: string): CreditStatusInfo => ({
  label: status,
  variant: 'outline',
  description: '',
  chipClass: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  dotClass: 'bg-neutral-400',
});

/**
 * Resuelve la info de un estado que llega como `string` (ej. desde un endpoint que lo
 * tipa laxo). Si no se reconoce, devuelve el código crudo en vez de romper — así un enum
 * nuevo del backend se ve raro pero no tumba la pantalla.
 */
export function creditStatusInfo(status: string): CreditStatusInfo {
  return CREDIT_STATUS_INFO[status as CreditStatus] ?? UNKNOWN_CREDIT_STATUS(status);
}

export function installmentStatusInfo(status: string): InstallmentStatusInfo {
  return INSTALLMENT_STATUS_INFO[status as InstallmentStatus]
    ?? { label: status, variant: 'outline', description: '' };
}
