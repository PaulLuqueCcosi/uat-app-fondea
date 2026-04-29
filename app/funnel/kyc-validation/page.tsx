import { FunnelKYCValidation } from '@/components/forms/funnel/FunnelKYCValidation';
import { getKYCData } from '@/app/actions/kyc.actions';

export default async function KYCValidationPage() {
  // Carga datos previos desde la API (null si el usuario aún no los ha guardado)
  const existingData = await getKYCData();

  return (
    <div className="py-4">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <FunnelKYCValidation initialData={existingData} />
      </div>
    </div>
  );
}
