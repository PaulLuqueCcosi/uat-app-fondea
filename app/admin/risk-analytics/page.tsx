import { ShieldAlert } from 'lucide-react';
import { ScoringAnalyticsDashboard } from '@/components/admin/scoring-analytics/ScoringAnalyticsDashboard';

export default function AdminRiskAnalyticsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <ShieldAlert className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Scoring y Riesgo</h1>
          <p className="text-sm text-muted-foreground">
            Tasa de aprobación, mora por banda de score y consultas a APIs — M6
          </p>
        </div>
      </div>

      <ScoringAnalyticsDashboard />
    </div>
  );
}
