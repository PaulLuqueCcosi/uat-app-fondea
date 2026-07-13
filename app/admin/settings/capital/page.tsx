import { Wallet, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CapitalConfigClient } from '@/components/admin/settings/CapitalConfigClient';
import { getActivePortfolioConfigAction } from '@/app/actions/portfolio.actions';

export default async function AdminCapitalSettingsPage() {
  const config = await getActivePortfolioConfigAction().catch(() => null);
  const initialCapitalBase = config?.capitalBase ?? 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Back */}
      <Link href="/admin/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" /> Configuración
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Capital Base</h1>
          <p className="text-sm text-muted-foreground">
            Configura el capital total disponible para préstamos
          </p>
        </div>
      </div>

      <CapitalConfigClient initialCapitalBase={initialCapitalBase} />
    </div>
  );
}
