import { PieChart } from 'lucide-react';
import { PassportSegmentationChart } from '@/components/admin/customers/PassportSegmentationChart';

export default function AdminPassportSegmentationPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
          <PieChart className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Segmentación por Pasaporte</h1>
          <p className="text-sm text-muted-foreground">
            Distribución de clientes activos por nivel — Bronce / Plata / Oro / Master
          </p>
        </div>
      </div>

      <PassportSegmentationChart />
    </div>
  );
}
