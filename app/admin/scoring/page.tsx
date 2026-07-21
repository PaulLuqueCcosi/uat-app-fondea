import { ArrowLeftRight } from 'lucide-react';
import { ScorecardClient } from '@/components/admin/scoring/ScorecardClient';

export default function AdminScoringPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <ArrowLeftRight className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Scorecard Interno</h1>
          <p className="text-sm text-muted-foreground">
            Configura las dimensiones, reglas y pesos para calcular el score interno de los usuarios
          </p>
        </div>
      </div>

      <ScorecardClient />
    </div>
  );
}
