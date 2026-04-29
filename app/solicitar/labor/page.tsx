import { redirect } from 'next/navigation';
import { getKYCData } from '@/app/actions/kyc.actions';
import { getLaborProfileStatus } from '@/app/actions/labor.actions';
import { FunnelLaborProfileShadcn } from '@/components/forms/solicitar/LaborProfileShadcn';

export default async function SolicitarLaborPage() {
  const { data: kycData } = await getKYCData();
  if (!kycData?.verified) {
    redirect('/solicitar/kyc-validation');
  }

  const laborStatus = await getLaborProfileStatus();

  return (
    <div className="py-4">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <FunnelLaborProfileShadcn initialData={laborStatus} />
      </div>
    </div>
  );
}
