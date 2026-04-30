import { redirect } from 'next/navigation';
import { getEconomicProfileStatus } from '@/app/actions/economic.actions';
import { getAddressProfileStatus } from '@/app/actions/additional-address.actions';
import { FunnelAddressShadcn } from '@/components/forms/solicitar/AddressShadcn';

export default async function FunnelAdditionalPage() {
  // El paso económico debe estar completado antes
  const economicStatus = await getEconomicProfileStatus();
  if (!economicStatus.overall_verified) {
    redirect('/solicitar/economic');
  }

  const addressStatus = await getAddressProfileStatus();

  return (
    <div className='py-4'>
      <div className='mx-auto w-full px-4 sm:px-6 lg:px-8'>
        <FunnelAddressShadcn initialData={addressStatus} />
      </div>
    </div>
  );
}
