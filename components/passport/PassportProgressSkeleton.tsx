import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

/**
 * Skeleton para la sección de progreso de nivel.
 */
export function PassportProgressSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barra de progreso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-3 w-52" />
        </div>

        {/* Grid de niveles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-neutral-200 p-3 flex flex-col items-center gap-1.5">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
