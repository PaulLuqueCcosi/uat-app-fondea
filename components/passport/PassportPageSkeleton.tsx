import { PassportSummaryCardsSkeleton } from './PassportSummaryCardsSkeleton';
import { PassportProgressSkeleton } from './PassportProgressSkeleton';
import { PassportHistorySkeleton } from './PassportHistorySkeleton';

/**
 * Skeleton completo de la página de pasaporte.
 * Compone los skeletons individuales de cada sección.
 */
export function PassportPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <PassportSummaryCardsSkeleton />
      <PassportProgressSkeleton />
      <PassportHistorySkeleton />
    </div>
  );
}
