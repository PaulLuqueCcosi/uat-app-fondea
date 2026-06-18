import Link from 'next/link';
import { FileText, ChevronRight, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getApplicationsAction } from '@/app/actions/application.actions';
import type { ApplicationRecord } from '@/lib/types';
import { ApplicationsListClient } from './ApplicationsListClient';

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
  const applications = allApplications.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Mis últimas solicitudes
          </span>
        </CardTitle>
        <CardDescription>
          {allApplications.length} {allApplications.length === 1 ? 'solicitud' : 'solicitudes'}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2 pb-0">
        <div className="divide-y divide-border">
          {applications.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground mb-3">Aún no tienes solicitudes</p>
              <Link
                href="/solicitar"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Crear primera solicitud
              </Link>
            </div>
          ) : (
            <ApplicationsListClient applications={applications} />
          )}
        </div>
      </CardContent>

      {allApplications.length > 0 && (
        <CardFooter>
          <Link
            href="/dashboard/loans"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Ver todas
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}

function ApplicationsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-5 w-36" />
          </span>
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-3.5 w-20" />
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-0">
        <div className="divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1 min-w-0 space-y-1">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-3.5 w-3.5" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-3.5 w-20" />
      </CardFooter>
    </Card>
  );
}

export const Applications = Object.assign(ApplicationsContent, {
  Skeleton: ApplicationsSkeleton,
});
