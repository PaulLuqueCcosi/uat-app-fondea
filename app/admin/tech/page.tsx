import { Cpu } from 'lucide-react';
import { TechOpsDashboard } from '@/components/admin/tech/TechOpsDashboard';

export default function AdminTechPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Cpu className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Tecnología y APIs</h1>
          <p className="text-sm text-muted-foreground">
            Señales para saber cuándo el equipo dev debe intervenir — M8
          </p>
        </div>
      </div>

      <TechOpsDashboard />
    </div>
  );
}
