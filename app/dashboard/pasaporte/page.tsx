import { Suspense } from 'react';
import { getPassportSummary } from '@/modules/passport';
import { PageTitle } from '@/components/ui/page-title';
import {
  PassportFlipBook,
  PassportHistoryTable,
  PassportErrorRouter,
  PassportPageSkeleton,
} from '@/components/passport';

export const dynamic = 'force-dynamic';

async function PassportLoader() {
  const summaryResult = await getPassportSummary();

  if (!summaryResult.ok) {
    return <PassportErrorRouter error={summaryResult.error} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PassportFlipBook summary={summaryResult.data} />
      {/* La tabla maneja su propia paginación server-side */}
      <PassportHistoryTable />
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
