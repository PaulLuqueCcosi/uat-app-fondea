import { ChevronRight, ClipboardList, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

async function getExpedienteProgress() {
  // TODO: Reemplazar con llamada real a BD
  return {
    progress: 20,
    completedCount: 1,
    totalCount: 5,
  };
}

async function ProgressBarContent() {
  const { progress, completedCount, totalCount } = await getExpedienteProgress();

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-0.5">
            <CardTitle className="text-base">Tu Expediente Digital</CardTitle>
            <CardDescription className="text-xs">
              Completa tu perfil para solicitar préstamos
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-bold text-primary">{progress}%</span>
          <span className="text-xs text-muted-foreground">completado</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        <div className="relative">
          <div className="h-3 overflow-hidden rounded-full bg-border/50 shadow-inner">
            <div
              className="h-full rounded-full bg-linear-to-r from-primary to-secondary shadow-sm transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle className={cn(
                "h-4 w-4",
                completedCount > 0 ? "text-secondary" : "text-border"
              )} />
              <span className="font-medium text-foreground">{completedCount} completadas</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {totalCount - completedCount} pendientes
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressBarSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          {/* Icono */}
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="space-y-1">
            {/* Título */}
            <Skeleton className="h-5 w-40" />
            {/* Descripción */}
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {/* Porcentaje */}
          <Skeleton className="h-7 w-16" />
          {/* Label */}
          <Skeleton className="h-3 w-24" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        {/* Progress bar */}
        <Skeleton className="h-3 w-full rounded-full" />
        <div className="flex items-center justify-between">
          {/* Contador */}
          <Skeleton className="h-4 w-40" />
        </div>
      </CardContent>
    </Card>
  );
}

export const ProgressBar = Object.assign(ProgressBarContent, {
  Skeleton: ProgressBarSkeleton,
});
