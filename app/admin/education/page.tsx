import { GraduationCap } from 'lucide-react';
import { EducationAnalyticsDashboard } from '@/components/admin/education/EducationAnalyticsDashboard';

export default function AdminEducationPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Educación Financiera</h1>
          <p className="text-sm text-muted-foreground">
            Acceso a &quot;Fondea Aprende&quot; y su relación con la mora — M10
          </p>
        </div>
      </div>

      <EducationAnalyticsDashboard />
    </div>
  );
}
