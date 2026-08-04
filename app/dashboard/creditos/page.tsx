import Link from 'next/link';
import { FileSignature, ChevronRight } from 'lucide-react';
import { PageTitle } from '@/components/ui/page-title';
import { Button } from '@/components/ui/button';
import { CreditsTable } from '@/components/credits/CreditsTable';

export const dynamic = 'force-dynamic';

export default function CreditosPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <PageTitle
          title="Mis Créditos"
          description="Todos tus préstamos desembolsados. Revisa estado, cuotas y comprobantes."
        />
        <Link href="/dashboard/creditos/ofertas">
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
            <FileSignature className="w-3.5 h-3.5" />
            Ofertas de refinanciamiento
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
      <CreditsTable />
    </div>
  );
}
