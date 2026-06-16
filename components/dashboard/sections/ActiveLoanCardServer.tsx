import { getActiveCredits, getNextDueInstallment } from '@/modules/credits';
import { ActiveLoanCard } from './ActiveLoanCard';

/**
 * Server wrapper que obtiene el crédito activo y la cuota a pagar.
 * Si no hay crédito activo o hay error, no renderiza nada.
 */
export async function ActiveLoanCardServer() {
  const result = await getActiveCredits();

  if (!result.ok) return null;

  const credit = result.data[0] ?? null;
  if (!credit) return null;

  // Obtener la cuota que toca pagar (lógica del backend)
  const nextDueResult = await getNextDueInstallment(credit.id);
  const nextDueInstallment = nextDueResult.ok ? nextDueResult.data : null;

  return <ActiveLoanCard credit={credit} nextDueInstallment={nextDueInstallment} />;
}
