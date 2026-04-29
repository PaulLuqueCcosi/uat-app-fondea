import { getBankAccountProfileStatus } from '@/app/actions/bank-account.actions';
import { FunnelBankAccountShadcn } from '@/components/forms/solicitar/BankAccountShadcn';

export default async function FunnelBankAccountPage() {
  // Cargar datos de cuenta bancaria existentes si los hay
  const bankAccountStatus = await getBankAccountProfileStatus();

  return (
    <div className='py-4'>
      <div className='mx-auto w-full px-4 sm:px-6 lg:px-8'>
        <FunnelBankAccountShadcn initialData={bankAccountStatus} />
      </div>
    </div>
  );
}
