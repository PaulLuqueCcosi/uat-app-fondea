import { getActiveCredit, getNextPayment, getInstallments } from '@/modules/credits';
import { getActiveApplicationAction } from '@/app/actions/application.actions';
import { ActiveLoanCard } from './ActiveLoanCard';

/**
 * Server wrapper que obtiene el crédito activo y la cuota a pagar.
 * Si no hay crédito activo o hay error, no renderiza nada.
 */
export async function ActiveLoanCardServer() {
  const result = await getActiveCredit();

  if (!result.ok || !result.data) return null;

  const credit = result.data;

  // Fetch en paralelo: próximo pago, cuotas, aplicación
  const [nextPayRes, installmentsRes, activeApp] = await Promise.all([
    getNextPayment(credit.id),
    getInstallments(credit.id),
    getActiveApplicationAction(),
  ]);

  const nextPayment = nextPayRes.ok ? nextPayRes.data : null;
  const installments = installmentsRes.ok ? installmentsRes.data : [];

  return (
    <ActiveLoanCard
      credit={credit}
      installments={installments}
      nextPayment={nextPayment}
      applicationId={activeApp?.id ?? null}
    />
  );
}
