import { notFound } from 'next/navigation';
import {
  getAdminUserForms,
  getAdminBankAccountFullData,
  getFormSubmissionsPage,
  getFormVerificationsPage,
} from '@/modules/admin';
import type { FormExpediente, BankAccountFullData } from '@/modules/admin';
import { FormStatusCard } from '@/components/admin/users/FormStatusCard';
import { FormLockCard } from '@/components/admin/users/FormLockCard';
import { AdminFormDataView } from '@/components/admin/users/AdminFormDataView';
import { FormSubmissionsHistory } from '@/components/admin/users/FormSubmissionsHistory';
import { FormVerificationHistory } from '@/components/admin/users/FormVerificationHistory';

// Mapa URL (kebab-case, igual a lo que ya esperan las server actions de unlock/reset/block)
// -> key del objeto UserExpedientes que devuelve el backend.
const SEGMENT_TO_KEY: Record<string, keyof NonNullable<Awaited<ReturnType<typeof getAdminUserForms>>>> = {
  kyc: 'kyc',
  labor: 'labor',
  economic: 'economic',
  references: 'references',
  address: 'address',
  'bank-account': 'bankAccount',
};

export default async function AdminUserFormDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; formType: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id, formType } = await params;
  const sp = await searchParams;
  const formKey = SEGMENT_TO_KEY[formType];
  if (!formKey) notFound();

  const submissionsPage = Number(sp.submissionsPage ?? 0);
  const submissionsSize = Number(sp.submissionsSize ?? 20);
  const verificationsPage = Number(sp.verificationsPage ?? 0);
  const verificationsSize = Number(sp.verificationsSize ?? 20);

  const [forms, bankFullData, submissionsPageData, verificationsPageData] = await Promise.all([
    getAdminUserForms(id),
    formKey === 'bankAccount' ? getAdminBankAccountFullData(id) : Promise.resolve(null as BankAccountFullData | null),
    getFormSubmissionsPage(id, formType, submissionsPage, submissionsSize),
    getFormVerificationsPage(id, formType, verificationsPage, verificationsSize),
  ]);

  if (!forms) notFound();
  const form = forms[formKey] as FormExpediente;

  const lastApproved = form.submissions.find((s) => s.verificationResult === 'APPROVED') ?? null;
  const dataToShow = formKey === 'bankAccount' && bankFullData
    ? { bank_name: bankFullData.bankName, account_type: bankFullData.accountType, cci: bankFullData.cci, account_number: bankFullData.accountNumber }
    : lastApproved?.submissionData ?? {};

  return (
    <div className="space-y-6">
      {/* Estado + Lock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormStatusCard form={form} />
        <FormLockCard lock={form.lock} userId={id} formType={formType} />
      </div>

      {/* Datos actuales */}
      <AdminFormDataView formKey={formKey} data={dataToShow} />

      {/* Historial de envíos (paginado) */}
      <FormSubmissionsHistory page={submissionsPageData} formKey={formKey} />

      {/* Historial de verificaciones (paginado) */}
      <FormVerificationHistory page={verificationsPageData} />
    </div>
  );
}
