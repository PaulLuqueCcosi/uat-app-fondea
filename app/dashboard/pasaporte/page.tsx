import { getPassportSummary, getPointsHistory } from '@/lib/passport';
import { PageTitle } from '@/components/ui/page-title';
import { PasaporteContent } from './PasaporteContent';

export const dynamic = 'force-dynamic';

export default async function PasaportePage() {
  const [summary, history] = await Promise.all([
    getPassportSummary(),
    getPointsHistory(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <PageTitle
        title="Pasaporte Financiero"
        description="Tu nivel determina cuánto puedes solicitar. Gana puntos pagando puntual y refiriendo amigos."
      />
      <PasaporteContent summary={summary} history={history} />
    </div>
  );
}
