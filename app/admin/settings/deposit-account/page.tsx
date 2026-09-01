import { Landmark, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { DepositAccountPage } from '@/components/admin/settings/DepositAccountPage';

export default async function AdminDepositAccountSettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Back */}
      <Link href="/admin/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" /> Configuración
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
          <Landmark className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Cuenta de depósito</h1>
          <p className="text-sm text-muted-foreground">
            Banco, número de cuenta y QR que ve el cliente al pagar una cuota
          </p>
        </div>
      </div>

      <DepositAccountPage />
    </div>
  );
}
