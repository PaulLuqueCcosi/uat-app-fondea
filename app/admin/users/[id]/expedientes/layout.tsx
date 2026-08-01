import { ExpedienteModuleTabsNav } from '@/components/admin/users/ExpedienteModuleTabsNav';

export default async function ExpedientesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-4">
      <ExpedienteModuleTabsNav userId={id} />
      {children}
    </div>
  );
}
