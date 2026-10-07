import { getActiveCredits, getNextPayment, getInstallments } from '@/modules/credits';
import { getMyNegotiationOffers } from '@/modules/negotiation-offers';
import { ActiveLoanCard } from './ActiveLoanCard';

/**
 * Server wrapper que obtiene TODOS los créditos activos del usuario y,
 * para cada uno, su cuota a pagar y cronograma.
 *
 * Un usuario puede tener más de un crédito activo simultáneamente: su
 * crédito natural (STANDARD) + créditos de negociación (NEGOTIATION)
 * abiertos para cuotas puntuales en mora. Se renderiza una card por cada uno.
 *
 * Documentos de cada card — siempre los de ESE crédito:
 * - STANDARD: el contrato de la solicitud que lo originó (`credit.applicationId`).
 *   Antes se usaba la solicitud "activa" del usuario, que es la que tiene en curso
 *   ahora — no necesariamente la del crédito que se está mostrando.
 * - NEGOTIATION: el acuerdo firmado de la oferta cuyo `resultingCreditId` es este crédito.
 *
 * Si no hay ningún crédito activo o hay error, no renderiza nada.
 */
export async function ActiveLoanCardServer() {
  const result = await getActiveCredits();

  if (!result.ok || result.data.length === 0) return null;

  const credits = result.data;

  // Solo hace falta si hay algún crédito de negociación (para encontrar su oferta firmada)
  const hasNegotiation = credits.some((c) => c.creditType === 'NEGOTIATION');
  const offersResult = hasNegotiation ? await getMyNegotiationOffers() : null;
  const offers = offersResult?.ok ? offersResult.data : [];

  const cards = await Promise.all(
    credits.map(async (credit) => {
      const [nextPayRes, installmentsRes] = await Promise.all([
        getNextPayment(credit.id),
        getInstallments(credit.id),
      ]);

      return {
        credit,
        nextPayment: nextPayRes.ok ? nextPayRes.data : null,
        installments: installmentsRes.ok ? installmentsRes.data : [],
        negotiationOfferId:
          credit.creditType === 'NEGOTIATION'
            ? offers.find((o) => o.resultingCreditId === credit.id)?.id ?? null
            : null,
      };
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      {cards.map(({ credit, nextPayment, installments, negotiationOfferId }) => (
        <ActiveLoanCard
          key={credit.id}
          credit={credit}
          installments={installments}
          nextPayment={nextPayment}
          applicationId={credit.creditType === 'STANDARD' ? credit.applicationId ?? null : null}
          negotiationOfferId={negotiationOfferId}
        />
      ))}
    </div>
  );
}
