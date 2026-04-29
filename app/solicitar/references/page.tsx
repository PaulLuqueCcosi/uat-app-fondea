import { redirect } from 'next/navigation';
import { getEconomicProfileStatus } from '@/app/actions/economic.actions';
import { getReferencesProfileStatus } from '@/app/actions/references.actions';
import { FunnelReferencesShadcn } from '@/components/forms/solicitar/ReferencesShadcn';

export default async function FunnelReferencesPage() {
  // Paso anterior (economic) debe estar completado
  const economicStatus = await getEconomicProfileStatus();
  if (!economicStatus.overall_verified) {
    redirect('/solicitar/economic');
  }

  // Cargar datos de referencias existentes si los hay
  const referencesStatus = await getReferencesProfileStatus();

  return (
    <div className='py-4'>
      <div className='mx-auto w-full px-4 sm:px-6 lg:px-8'>
        <FunnelReferencesShadcn initialData={referencesStatus} />
      </div>
    </div>
  );
}
