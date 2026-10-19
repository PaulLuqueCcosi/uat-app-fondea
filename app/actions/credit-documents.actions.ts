'use server';

import { requireValidSession } from './auth.actions';
import { getContractInfoAction, getContractPdfUrlAction } from './contract.actions';
import { getNegotiationOfferByIdAction, getMyNegotiationOffersAction } from './negotiation-offer.actions';
import { getCreditByIdAction } from './credit.actions';

export interface CreditDocument {
  id: string;
  /** Label shown in the dropdown. */
  label: string;
  /** Presigned PDF URL (short-lived: resolved when the menu opens, not at page load). */
  url: string;
}

export interface CreditDocumentsSource {
  /** STANDARD credit: application that originated it. */
  applicationId?: string | null;
  /** NEGOTIATION credit: signed offer that originated it. */
  negotiationOfferId?: string | null;
}

/**
 * Downloadable documents of ONE credit.
 * - STANDARD: signed contract of the originating application.
 * - NEGOTIATION: signed documents of the originating refinancing offer.
 *
 * Reuses existing endpoints (no new backend surface). Returns an empty list when
 * nothing is downloadable yet; never throws to the UI.
 */
export async function getCreditDocumentsAction(source: CreditDocumentsSource): Promise<CreditDocument[]> {
  await requireValidSession();

  try {
    if (source.negotiationOfferId) {
      const result = await getNegotiationOfferByIdAction(source.negotiationOfferId);
      if (!result.ok) return [];
      return result.data.documents
        .filter((d) => !!d.pdfUrl)
        .map((d) => ({ id: d.contractId, label: d.name, url: d.pdfUrl as string }));
    }

    if (source.applicationId) {
      const info = await getContractInfoAction(source.applicationId);
      // The backend also uses FINALIZED after signing (see contracts_contract status check).
      const status: string | undefined = info?.status;
      if (!info || (status !== 'SIGNED' && status !== 'FINALIZED')) return [];
      const url = await getContractPdfUrlAction(source.applicationId);
      return url ? [{ id: info.contractId, label: 'Contrato firmado', url }] : [];
    }

    return [];
  } catch (err) {
    console.error('[CREDIT_DOCUMENTS] Error al obtener documentos del crédito:', err);
    return [];
  }
}

/**
 * Same as {@link getCreditDocumentsAction} but starting from the credit id alone
 * (credit detail page): resolves the originating application / signed offer first.
 */
export async function getDocumentsByCreditIdAction(creditId: string): Promise<CreditDocument[]> {
  await requireValidSession();

  try {
    const creditRes = await getCreditByIdAction(creditId);
    if (!creditRes.ok) return [];
    const credit = creditRes.data;

    if (credit.creditType === 'NEGOTIATION') {
      const offersRes = await getMyNegotiationOffersAction();
      const offerId = offersRes.ok
        ? offersRes.data.find((o) => o.resultingCreditId === credit.id)?.id ?? null
        : null;
      return getCreditDocumentsAction({ negotiationOfferId: offerId });
    }

    return getCreditDocumentsAction({ applicationId: credit.applicationId ?? null });
  } catch (err) {
    console.error('[CREDIT_DOCUMENTS] Error al resolver documentos por crédito:', err);
    return [];
  }
}
