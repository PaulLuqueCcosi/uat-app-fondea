import { redirect } from 'next/navigation';
import { getLaborProfileStatus } from '@/app/actions/labor.actions';
import { FunnelEconomicProfileShadcn } from '@/components/forms/solicitar/EconomicProfileShadcn';

export default async function SolicitarEconomicPage() {
  // Paso 1 (labor) debe estar completado
  const laborStatus = await getLaborProfileStatus();
  if (!laborStatus.overall_verified) {
    redirect('/solicitar/labor');
  }

  return (
    <div className="py-4">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <FunnelEconomicProfileShadcn />
      </div>
    </div>
  );
}
