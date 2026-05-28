import { getApplicationsAction } from '@/app/actions/application.actions';
import { LoansListClient } from './LoansListClient';

/**
 * Server Component que fetchea las aplicaciones.
 * Se envuelve en <Suspense> para que el skeleton aparezca
 * mientras se resuelve getApplicationsAction().
 */
export async function LoansListServer() {
  const data = await getApplicationsAction();
  return <LoansListClient applications={data?.applications ?? []} />;
}
