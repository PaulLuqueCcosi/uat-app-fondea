import { getReferralSummary, getReferrals } from '@/lib/referrals';
import { PageTitle } from '@/components/ui/page-title';
import { ReferidosContent } from './ReferidosContent';

export const dynamic = 'force-dynamic';

export default async function ReferidosPage() {
  const [summary, referrals] = await Promise.all([
    getReferralSummary(),
    getReferrals(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <PageTitle
        title="Programa de Referidos"
        description="Invita amigos y gana puntos para tu Pasaporte Financiero."
      />
      <ReferidosContent summary={summary} referrals={referrals} />
    </div>
  );
}
