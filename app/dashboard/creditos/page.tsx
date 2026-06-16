import { PageTitle } from '@/components/ui/page-title';
import { CreditsTable } from '@/components/credits/CreditsTable';

export const dynamic = 'force-dynamic';

export default function CreditosPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <PageTitle
        title="Mis Créditos"
        description="Todos tus préstamos desembolsados. Revisa estado, cuotas y comprobantes."
      />
      <CreditsTable />
    </div>
  );
}
