/**
 * Tipos del dominio Ofertas de Negociación — alineados al backend real.
 *
 * ⚠️ A diferencia de `modules/credits` (snake_case), este backend usa
 * camelCase plano (sin @JsonProperty por campo). El mapper igual existe
 * para aislar al resto del front de la forma exacta del backend y para
 * normalizar valores por defecto de forma segura.
 */

// ─── Estados ──────────────────────────────────────────────────────────────────

/**
 * Estado de una oferta de negociación (backend enum).
 * - SENT: esperando respuesta del cliente
 * - ACCEPTED: firmada, el crédito de negociación se crea (puede tardar unos segundos)
 * - REJECTED: el cliente la rechazó
 * - EXPIRED: venció el plazo de firma sin respuesta (scheduler corre cada hora)
 */
export type NegotiationOfferStatus = 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

// ─── Cronograma propuesto ─────────────────────────────────────────────────────

/** Una cuota del cronograma propuesto por el admin — 100% manual */
export interface NegotiationScheduleItem {
  installmentNo: number;
  dueDate: string;
  amount: number;
}

// ─── Oferta ───────────────────────────────────────────────────────────────────

/** Oferta de negociación — NegotiationOfferResponse del backend */
export interface NegotiationOffer {
  id: string;
  /** La cuota en mora que esta oferta busca cerrar */
  originInstallmentId: string;
  /** El crédito al que pertenece esa cuota */
  originCreditId: string;
  userId: string;
  /**
   * Nombre del cliente (nombre + apellido paterno). Solo viene poblado en los
   * endpoints admin (`/admin/negotiation-offers*`) — en los endpoints de
   * cliente (`/mine`, `/{id}`, accept/reject) siempre es `null` porque no
   * aporta nada mostrarle al usuario su propio nombre.
   */
  clientName: string | null;
  /** DNI del cliente. Misma regla que `clientName` — solo poblado en admin. */
  clientDocument: string | null;
  status: NegotiationOfferStatus;
  schedule: NegotiationScheduleItem[];
  totalAmount: number;
  /** Fecha límite para que el cliente firme (ISO datetime) */
  signDeadline: string;
  /**
   * Null hasta que la oferta se acepta Y el crédito termina de crearse
   * (proceso asíncrono, normalmente casi instantáneo).
   */
  resultingCreditId: string | null;
  /** Solo poblado si status = REJECTED */
  rejectionReason: string | null;
  createdBy: string;
  createdAt: string;
  respondedAt: string | null;
}

/** Documento a revisar antes de firmar — parte de NegotiationOfferDetailResponse */
export interface NegotiationOfferDocument {
  contractId: string;
  name: string;
  /** Si true, el cliente puede ver el HTML antes de firmar */
  visibleBeforeSignature: boolean;
  /** GENERATED, SIGNED, FINALIZED, EXPIRED */
  status: string;
  /** URL del PDF — solo disponible post-firma (SIGNED/FINALIZED) */
  pdfUrl: string | null;
}

/** Detalle de oferta + documentos — NegotiationOfferDetailResponse del backend */
export interface NegotiationOfferDetail {
  offer: NegotiationOffer;
  documents: NegotiationOfferDocument[];
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface AcceptNegotiationOfferRequest {
  signedName: string;
  signatureImage?: string;
}

export interface RejectNegotiationOfferRequest {
  reason: string;
}

/**
 * Request del admin para crear una oferta de negociación sobre una cuota
 * en mora. Cronograma 100% manual — no se valida contra la deuda real.
 * POST /api/v1/admin/negotiation-offers
 */
export interface CreateNegotiationOfferRequest {
  installmentId: string;
  signDeadlineDays: number;
  schedule: NegotiationScheduleItem[];
}

// ─── Labels legibles ──────────────────────────────────────────────────────────

export const negotiationOfferStatusLabels: Record<NegotiationOfferStatus, string> = {
  SENT: 'Pendiente de firma',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Expirada',
};

// ─── Helpers de vigencia ──────────────────────────────────────────────────────

/**
 * Determina si una oferta todavía puede firmarse: no basta con status === 'SENT',
 * porque el scheduler que marca EXPIRED corre cada hora — puede haber una ventana
 * donde el status en BD siga SENT pero signDeadline ya pasó. Comparamos siempre
 * contra la hora actual del cliente para no dejar que el usuario llegue a un 409.
 */
export function isOfferSignable(offer: NegotiationOffer): boolean {
  if (offer.status !== 'SENT') return false;
  return new Date(offer.signDeadline).getTime() > Date.now();
}

/** True si la oferta sigue SENT en BD pero su plazo ya venció (aún no la procesó el scheduler) */
export function isOfferStaleExpired(offer: NegotiationOffer): boolean {
  if (offer.status !== 'SENT') return false;
  return new Date(offer.signDeadline).getTime() <= Date.now();
}

/** Texto de urgencia legible según cuánto falta para el signDeadline */
export function formatDeadlineUrgency(signDeadline: string): { label: string; urgent: boolean } {
  const diffMs = new Date(signDeadline).getTime() - Date.now();
  if (diffMs <= 0) return { label: 'Venció', urgent: true };
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) {
    const hours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
    return { label: `Vence en ${hours}h`, urgent: true };
  }
  return { label: `Vence en ${days} día${days > 1 ? 's' : ''}`, urgent: days <= 2 };
}
