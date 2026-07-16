import { Wallet } from 'lucide-react';
import { FundManagement } from '@/components/admin/fund/FundManagement';

export default function AdminFundPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Fondo de Capital</h1>
          <p className="text-sm text-muted-foreground">
            Estado del fondo, movimientos y auditoría completa
          </p>
        </div>
      </div>

      <FundManagement />
    </div>
  );
}
