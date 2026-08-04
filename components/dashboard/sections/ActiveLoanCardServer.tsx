import { getActiveCredits, getNextPayment, getInstallments } from '@/modules/credits';
import { getActiveApplicationAction } from '@/app/actions/application.actions';
import { ActiveLoanCard } from './ActiveLoanCard';

/**
 * Server wrapper que obtiene TODOS los créditos activos del usuario y,
 * para cada uno, su cuota a pagar y cronograma.
 *
 * Un usuario puede tener más de un crédito activo simultáneamente: su
 * crédito natural (STANDARD) + créditos de negociación (NEGOTIATION)
 * abiertos para cuotas puntuales en mora. Se renderiza una card por cada uno.
 *
 * Si no hay ningún crédito activo o hay error, no renderiza nada.
 */
export async function ActiveLoanCardServer() {
  const result = await getActiveCredits();

  if (!result.ok || result.data.length === 0) return null;

  const credits = result.data;

  // El link a documentos del contrato solo aplica al crédito STANDARD
  // (los de negociación no vienen de una solicitud con contrato de mutuo)
  const activeApp = await getActiveApplicationAction();

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
      };
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      {cards.map(({ credit, nextPayment, installments }) => (
        <ActiveLoanCard
          key={credit.id}
          credit={credit}
          installments={installments}
          nextPayment={nextPayment}
          applicationId={credit.creditType === 'STANDARD' ? (activeApp?.id ?? null) : null}
        />
      ))}
    </div>
  );
}
