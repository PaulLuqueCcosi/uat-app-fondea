import Link from 'next/link';
import { FileText, ChevronRight, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getApplicationsAction } from '@/app/actions/application.actions';
import type { ApplicationRecord } from '@/lib/types';

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

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

function getStatusVariant(status: string): 'completed' | 'pending' | 'error' | 'warning' {
  const statusUpper = status.toUpperCase();
  if (statusUpper === 'APPROVED') return 'completed';
  if (statusUpper === 'REJECTED') return 'error';
  if (statusUpper === 'MORE_INFO') return 'warning';
  return 'pending';
}

async function ApplicationsContent() {
  const applicationsData = await getApplicationsAction();
  const allApplications = applicationsData?.applications ?? [];
  const applications = allApplications.slice(0, 5);
  const hasMore = allApplications.length > 5;

  return (
    <Card>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <h2 className="font-semibold text-dark">Mis últimas solicitudes</h2>
        <span className="ml-auto text-xs text-fondea-text">
          {allApplications.length} {allApplications.length === 1 ? 'solicitud' : 'solicitudes'}
        </span>
      </div>
      <div className="divide-y divide-border">
        {applications.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-fondea-text mb-3">Aún no tienes solicitudes</p>
            <Link
              href="/solicitar"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear primera solicitud
            </Link>
          </div>
        ) : (
          <>
            {applications.map((app) => (
              <div key={app.id} className="relative">
                <Link
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
                </Link>
              </div>
            ))}
            {hasMore && (
              <div className="px-5 py-3 text-center">
                <Link
                  href="/dashboard/loans"
                  className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
                >
                  Ver todas las solicitudes
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function ApplicationsSkeleton() {
  return (
    <Card>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <Skeleton className="w-7 h-7 rounded-full shrink-0" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20 ml-auto" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3.5">
            {/* Icono */}
            <Skeleton className="w-9 h-9 rounded-full shrink-0" />
            {/* Contenido */}
            <div className="flex-1 min-w-0 space-y-1">
              {/* Título */}
              <Skeleton className="h-4 w-32" />
              {/* Fecha */}
              <Skeleton className="h-3 w-24" />
            </div>
            {/* Badge + Chevron */}
            <div className="flex items-center gap-2 shrink-0">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export const Applications = Object.assign(ApplicationsContent, {
  Skeleton: ApplicationsSkeleton,
});
