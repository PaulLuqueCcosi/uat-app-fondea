import { FileText, ChevronRight, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ApplicationRecord } from '@/lib/types';

// Helper para formatear fecha
function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Helper para obtener el label del estado
function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    DRAFT: 'Borrador',
    SUBMITTED: 'Enviada',
    EVALUATING: 'En evaluación',
    APPROVED: 'Aprobada',
    MORE_INFO: 'Requiere información',
    REJECTED: 'Rechazada',
  };
  return statusMap[status.toUpperCase()] ?? status;
}

// Helper para obtener el variant del badge
function getStatusVariant(status: string): 'completed' | 'pending' | 'error' | 'warning' {
  const statusUpper = status.toUpperCase();
  if (statusUpper === 'APPROVED') return 'completed';
  if (statusUpper === 'REJECTED') return 'error';
  if (statusUpper === 'MORE_INFO') return 'warning';
  return 'pending';
}

interface ApplicationsSectionServerProps {
  applications: ApplicationRecord[];
}

export async function ApplicationsSectionServer({ applications }: ApplicationsSectionServerProps) {
  // Simular delay de servidor (reemplazar con llamada real a BD)
  await new Promise(resolve => setTimeout(resolve, 800));

  return (
    <Card>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <h2 className="font-semibold text-dark">Mis Solicitudes</h2>
        <span className="ml-auto text-xs text-fondea-text">
          {applications.length} {applications.length === 1 ? 'solicitud' : 'solicitudes'}
        </span>
      </div>
      <div className="divide-y divide-border">
        {applications.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-fondea-text mb-3">Aún no tienes solicitudes</p>
            <a
              href="/solicitar"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear primera solicitud
            </a>
          </div>
        ) : (
          applications.map((app) => (
            <a
              key={app.id}
              href={`/solicitudes/${app.id}`}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-background transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark">
                  Solicitud #{app.id.slice(0, 8)}
                </p>
                <p className="text-xs text-fondea-text">
                  {app.submittedAt ? formatDate(app.submittedAt) : '—'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={getStatusVariant(app.status)}>
                  {getStatusLabel(app.status)}
                </Badge>
                <ChevronRight className="w-4 h-4 text-fondea-text" />
              </div>
            </a>
          ))
        )}
      </div>
    </Card>
  );
}
