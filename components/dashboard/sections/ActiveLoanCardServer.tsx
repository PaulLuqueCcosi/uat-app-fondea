import { getActiveCredits } from '@/modules/credits';
import { ActiveLoanCard } from './ActiveLoanCard';

/**
 * Server wrapper que obtiene el crédito activo y lo pasa al componente cliente.
 * Si no hay crédito activo o hay error, no renderiza nada.
 */
export async function ActiveLoanCardServer() {
  const result = await getActiveCredits();

  if (!result.ok) return null;

  const credit = result.data[0] ?? null;
  if (!credit) return null;

  return <ActiveLoanCard credit={credit} />;
}
