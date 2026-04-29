import { FunnelKYCValidation } from '@/components/forms/solicitar/KYCValidation';
import { getKYCData } from '@/app/actions/kyc.actions';

export default async function KYCValidationPage() {
  const { data, blocked, blockedHoursLeft, attemptsLeft } = await getKYCData();

  return (
    <div className="py-4">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <FunnelKYCValidation
          initialData={data}
          initialBlocked={blocked}
          initialBlockedHoursLeft={blockedHoursLeft}
          initialAttemptsLeft={attemptsLeft}
        />
      </div>
    </div>
  );
}
