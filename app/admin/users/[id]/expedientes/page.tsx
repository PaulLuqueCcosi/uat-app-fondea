import { redirect } from 'next/navigation';

/** /admin/users/[id]/expedientes sin módulo específico — redirige a KYC por defecto */
export default async function AdminUserExpedientesIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/users/${id}/expedientes/kyc`);
}
