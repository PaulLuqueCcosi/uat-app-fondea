/**
 * Tipos del dominio Declaraciones de Pago — alineados al backend real (módulo `depositos`).
 *
 * El cliente no tiene pasarela de cobro real: transfiere por su cuenta y sube
 * el comprobante (foto) para que un admin lo valide manualmente. El pago
 * recién se aplica cuando la declaración pasa a APPROVED.
 *
 * El backend devuelve snake_case con @JsonProperty (misma convención que `credit`).
 * El mapper transforma a estos tipos camelCase.
 */

// ─── Estados ──────────────────────────────────────────────────────────────────

/** Estado de una declaración de pago (backend enum). */
export type PaymentDeclarationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// ─── Voucher ──────────────────────────────────────────────────────────────────

/** Comprobante individual dentro de una declaración — VoucherSummary del backend */
export interface VoucherSummary {
  id: string;
  operationNumber: string;
  amount: number;
}

// ─── Declaración de pago ──────────────────────────────────────────────────────

/** Declaración de pago con comprobante — PaymentDeclarationResponse del backend */
export interface PaymentDeclaration {
  id: string;
  creditId: string;
  installmentNo: number;
  userId: string;
  status: PaymentDeclarationStatus;
  /** Suma de los montos declarados por el cliente en los vouchers */
  declaredAmount: number;
  /** Monto que efectivamente se aplicó al crédito — solo si ya fue revisada (APPROVED) */
  appliedAmount: number | null;
  /** Motivo visible para el cliente si fue rechazada — null si no aplica */
  clientMessage: string | null;
  /** Identificador del admin que revisó — null si aún no fue revisada */
  reviewedBy: string | null;
  /** Fecha/hora de revisión (ISO) — null si aún no fue revisada */
  reviewedAt: string | null;
  /** Fecha/hora de creación (ISO) */
  createdAt: string;
  vouchers: VoucherSummary[];
}

// ─── Labels legibles ──────────────────────────────────────────────────────────

export const paymentDeclarationStatusLabels: Record<PaymentDeclarationStatus, string> = {
  PENDING: 'En revisión',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

// ─── Admin — detalle ────────────────────────────────────────────────────────

/**
 * Comprobante con foto — VoucherDetail del backend (solo en el detalle admin,
 * el listado usa VoucherSummary sin `photoUrl`).
 */
export interface VoucherDetail extends VoucherSummary {
  /** URL pre-firmada de S3/MinIO — se puede usar directo en <img>, no expira de inmediato */
  photoUrl: string;
}

/** Una cuota dentro del resultado de aplicación del pago — parte de PaymentResult */
export interface PaymentResultDistribution {
  installmentNo: number;
  appliedToPenalty: number;
  appliedToInterest: number;
  appliedToPrincipal: number;
  /** Suma de appliedToInterest + appliedToPrincipal (todo lo que no es mora). */
  appliedToInstallment: number;
  /** Estado resultante de la cuota tras aplicar el pago (enum de `credit`, ej. PAID/PARTIALLY_PAID) */
  resultingStatus: string;
}

/**
 * A dónde fue el dinero tras aprobar la declaración — DTO de `credit`. Igual que el
 * resto del payload, viene en snake_case (@JsonProperty explícito en
 * PaymentResultResponse.java) — el mapper lo traduce a camelCase acá.
 * Solo presente si status === 'APPROVED'.
 */
export interface PaymentResult {
  creditId: string;
  totalApplied: number;
  remaining: number;
  creditStatus: string;
  distributions: PaymentResultDistribution[];
}

/** Detalle completo de una declaración de pago — PaymentDeclarationDetailResponse del backend */
export interface PaymentDeclarationDetail {
  id: string;
  creditId: string;
  installmentNo: number;
  userId: string;
  status: PaymentDeclarationStatus;
  declaredAmount: number;
  appliedAmount: number | null;
  /** Cuota a la que realmente se aplicó el pago — difiere de installmentNo si el admin la redirigió al aprobar */
  appliedInstallmentNo: number | null;
  /** Motivo que dejó el admin al redirigir el pago a una cuota distinta a la declarada */
  targetChangeReason: string | null;
  clientMessage: string | null;
  /** Nota solo visible para admins — null si no fue revisada o no se dejó nota */
  internalNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  vouchers: VoucherDetail[];
  /** Deuda total del crédito calculada EN VIVO por el backend — no cachear */
  creditOutstandingTotal: number;
  /** Deuda de esta cuota específica calculada EN VIVO — no cachear */
  installmentOutstanding: number;
  /** true si declaredAmount excede la deuda total del crédito */
  exceedsTotalDebt: boolean;
  /** true si hay otra(s) declaración(es) que podrían ser el mismo comprobante duplicado */
  possibleDuplicate: boolean;
  duplicateDeclarationIds: string[];
  /** Solo viene si status === 'APPROVED' */
  paymentResult: PaymentResult | null;
}

// ─── Admin — filtros de listado ─────────────────────────────────────────────

export interface AdminPaymentDeclarationListParams {
  page: number;
  size: number;
  /** Repetible en la querystring (?status=PENDING&status=APPROVED) */
  status?: PaymentDeclarationStatus[];
  creditId?: string;
  sortBy?: 'createdAt' | 'declaredAmount';
  sortDir?: 'asc' | 'desc';
}

// ─── Admin — requests de acciones ───────────────────────────────────────────

export interface ApprovePaymentDeclarationRequest {
  appliedAmount: number;
  /**
   * Cuota objetivo final. Omitir para conservar la que declaró el cliente.
   *
   * El pago se aplica en orden sobre las cuotas cobrables con número menor o igual a
   * esta, de la más antigua a la más nueva — nunca a cuotas posteriores. Si el cliente
   * declaró la cuota 4 pero debe también la 2 y la 3, el pago las cubre primero.
   */
  targetInstallmentNo?: number;
  /** Obligatorio si `targetInstallmentNo` difiere de la cuota declarada por el cliente. */
  targetChangeReason?: string;
  adminNote?: string;
}

// ─── Admin — cotización de pago (módulo `credit`) ───────────────────────────

/** Una cuota dentro de la cotización — InstallmentQuote del backend. */
export interface InstallmentQuote {
  installmentNo: number;
  dueDate: string;
  status: string;
  /** Mora pendiente de esta cuota (0 si no está incluida en el cobro). */
  penalty: number;
  /** Interés contractual pendiente. */
  interest: number;
  /** Capital pendiente. */
  principal: number;
  /** penalty + interest + principal. */
  total: number;
  /** Si esta cuota entra en el cobro (excluye PAID y NEGOTIATED). */
  included: boolean;
  /** Si es la cuota objetivo de la cotización. */
  isTarget: boolean;
  negotiationCreditId: string | null;
}

/**
 * Cuánto se debe hasta una cuota objetivo — `GET /api/v1/admin/credits/{id}/installments/{no}/quote`.
 *
 * El backend sincroniza la mora antes de calcular, así que los montos son los vigentes al
 * momento de pedirla. No se persiste nada.
 */
export interface PaymentQuote {
  creditId: string;
  targetInstallmentNo: number;
  /** Monto máximo que se puede aplicar apuntando a esta cuota (suma de las cobrables ≤ target). */
  maximumAllowed: number;
  generatedAt: string;
  /** Cuándo se sincronizó la mora para esta cotización. */
  penaltyTimestamp: string;
  /** Hash SHA-256 de la cotización — permite detectar si cambió antes de aplicar. */
  fingerprint: string;
  installments: InstallmentQuote[];
}

export interface RejectPaymentDeclarationRequest {
  clientMessage: string;
  internalNote?: string;
}
