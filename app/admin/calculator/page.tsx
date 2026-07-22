import { CalculatorAdminClient } from '@/components/admin/calculator/CalculatorAdminClient';
import { Calculator } from 'lucide-react';

export default function AdminCalculatorPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Motor de Pricing</h1>
          <p className="text-sm text-muted-foreground">
            Configura montos, plazos, tarifas y descuentos del producto
          </p>
        </div>
      </div>

      <CalculatorAdminClient />
    </div>
  );
}
