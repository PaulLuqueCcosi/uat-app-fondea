import { redirect } from 'next/navigation';
import { getKYCData } from '@/app/actions/kyc.actions';
import { FunnelLaborProfileShadcn } from '@/components/forms/solicitar/LaborProfileShadcn';

export default async function FunnelLaborPage() {
  // El KYC debe estar verificado para poder avanzar al siguiente paso
  const { data } = await getKYCData();

  if (!data?.verified) {
    redirect('/solicitar/kyc-validation');
  }

  return (
    <div className="py-4">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <FunnelLaborProfileShadcn />
      </div>
    </div>
  );
}
