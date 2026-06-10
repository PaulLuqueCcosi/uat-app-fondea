import { getActiveCredits } from '@/lib/credits';
import { ActiveLoanCard } from './ActiveLoanCard';

/**
 * Server wrapper que obtiene el crédito activo y lo pasa al componente cliente.
 * Si no hay crédito activo, no renderiza nada.
 */
export async function ActiveLoanCardServer() {
  const activeCredits = await getActiveCredits();
  const credit = activeCredits[0] ?? null;

  if (!credit) return null;

  return <ActiveLoanCard credit={credit} />;
}
