/**
 * Mapper de Ofertas de Negociación — Backend (camelCase plano) → Frontend.
 *
 * El backend de este módulo ya usa camelCase (no snake_case como `credits`),
 * así que el mapper aquí es sobre todo para normalizar valores por defecto
 * de forma segura — NUNCA lanza excepciones si un campo falta.
 */

import type {
  NegotiationOffer,
  NegotiationOfferDetail,
  NegotiationOfferDocument,
  NegotiationOfferStatus,
  NegotiationScheduleItem,
} from './negotiation-offer.types';

const VALID_STATUSES: NegotiationOfferStatus[] = ['SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'];

function mapStatus(raw: unknown): NegotiationOfferStatus {
  const upper = String(raw ?? '').toUpperCase();
  return VALID_STATUSES.includes(upper as NegotiationOfferStatus)
    ? (upper as NegotiationOfferStatus)
    : 'SENT';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapScheduleItem(raw: any): NegotiationScheduleItem {
  return {
    installmentNo: raw.installmentNo ?? 0,
    dueDate: raw.dueDate ?? '',
    amount: raw.amount ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapNegotiationOfferFromBackend(raw: any): NegotiationOffer {
  return {
    id: raw.id ?? '',
    originInstallmentId: raw.originInstallmentId ?? '',
    originCreditId: raw.originCreditId ?? '',
    userId: raw.userId ?? '',
    clientName: raw.clientName ?? null,
    clientDocument: raw.clientDocument ?? null,
    status: mapStatus(raw.status),
    schedule: Array.isArray(raw.schedule) ? raw.schedule.map(mapScheduleItem) : [],
    totalAmount: raw.totalAmount ?? 0,
    signDeadline: raw.signDeadline ?? '',
    resultingCreditId: raw.resultingCreditId ?? null,
    rejectionReason: raw.rejectionReason ?? null,
    createdBy: raw.createdBy ?? '',
    createdAt: raw.createdAt ?? '',
    respondedAt: raw.respondedAt ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDocument(raw: any): NegotiationOfferDocument {
  return {
    name: raw.name ?? '',
    url: raw.url ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapNegotiationOfferDetailFromBackend(raw: any): NegotiationOfferDetail {
  return {
    offer: mapNegotiationOfferFromBackend(raw.offer ?? {}),
    documents: Array.isArray(raw.documents) ? raw.documents.map(mapDocument) : [],
  };
}
