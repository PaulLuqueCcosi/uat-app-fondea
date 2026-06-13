import { Suspense } from 'react';
import { getPassportSummary, getPointsHistory } from '@/modules/passport';
import { PageTitle } from '@/components/ui/page-title';
import {
  PassportFlipBook,
  PassportSummaryCards,
  PassportProgress,
  PassportHistory,
  PassportPageSkeleton,
} from '@/components/passport';
import { ModuleErrorState } from '@/components/shared/ModuleErrorState';

export const dynamic = 'force-dynamic';

async function PassportLoader() {
  const [summaryResult, historyResult] = await Promise.all([
    getPassportSummary(),
    getPointsHistory(),
  ]);

  if (!summaryResult.ok) {
    return <ModuleErrorState error={summaryResult.error} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PassportFlipBook summary={summaryResult.data} />
      <PassportSummaryCards summary={summaryResult.data} />
      <PassportProgress summary={summaryResult.data} />
      <PassportHistory
        history={historyResult.ok ? historyResult.data : []}
      />
    </div>
  );
}

export default function PasaportePage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <PageTitle
        title="Pasaporte Financiero"
        description="Tu nivel determina cuánto puedes solicitar. Gana puntos pagando puntual y refiriendo amigos."
      />

      <Suspense fallback={<PassportPageSkeleton />}>
        <PassportLoader />
      </Suspense>
    </div>
  );
}
