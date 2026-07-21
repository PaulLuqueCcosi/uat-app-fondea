import { EvaluationRulesClient } from '@/components/admin/evaluation-rules/EvaluationRulesClient';
import { Shield } from 'lucide-react';

export default function AdminEvaluationRulesPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Motor de Reglas</h1>
          <p className="text-sm text-muted-foreground">
            Configura reglas eliminatorias y de scoring para la evaluación de solicitudes
          </p>
        </div>
      </div>

      <EvaluationRulesClient />
    </div>
  );
}
