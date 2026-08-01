import { getKYCData } from '@/app/actions/kyc.actions';
import { getLaborProfileStatus } from '@/app/actions/labor.actions';
import { getEconomicProfileStatus } from '@/app/actions/economic.actions';
import { getReferencesProfileStatus } from '@/app/actions/references.actions';
import { getAddressProfileStatus } from '@/app/actions/additional-address.actions';
import { getBankAccountProfileStatus } from '@/app/actions/bank-account.actions';
import { MiExpedienteClient } from '@/components/dashboard/MiExpedienteClient';

export const dynamic = 'force-dynamic';

export default async function MiExpedientePage() {
  const [kycResult, laborStatus, economicStatus, referencesStatus, addressStatus, bankAccountStatus] =
    await Promise.all([
      getKYCData(),
      getLaborProfileStatus(),
      getEconomicProfileStatus(),
      getReferencesProfileStatus(),
      getAddressProfileStatus(),
      getBankAccountProfileStatus(),
    ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <MiExpedienteClient
        kycData={kycResult.data}
        kycBlocked={kycResult.blocked}
        kycBlockedHoursLeft={kycResult.blockedHoursLeft}
        kycAttemptsLeft={kycResult.attemptsLeft}
        laborData={laborStatus}
        economicData={economicStatus}
        referencesData={referencesStatus}
        addressData={addressStatus}
        bankAccountData={bankAccountStatus}
      />
    </div>
  );
}
