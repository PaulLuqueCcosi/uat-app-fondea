import { CircleDollarSign, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PenaltyConfigPage } from '@/components/admin/settings/PenaltyConfigPage';

export default async function AdminPenaltySettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Back */}
      <Link href="/admin/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" /> Configuración
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-warning-50 flex items-center justify-center">
          <CircleDollarSign className="h-5 w-5 text-warning-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Configuración de Mora</h1>
          <p className="text-sm text-muted-foreground">
            Define los rangos de penalidad por días de atraso
          </p>
        </div>
      </div>

      <PenaltyConfigPage />
    </div>
  );
}
