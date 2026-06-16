import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

/**
 * Skeleton completo de la página de pasaporte.
 * Simula: FlipBook + Tabla de historial.
 */
export function PassportPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* FlipBook skeleton */}
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="flex gap-1 rounded-xl overflow-hidden shadow-lg">
          <Skeleton className="w-[200px] h-[270px] md:w-[280px] md:h-[380px] rounded-none" />
          <Skeleton className="w-[200px] h-[270px] md:w-[280px] md:h-[380px] rounded-none hidden md:block" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>

      {/* Tabla historial skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Buscador */}
          <Skeleton className="h-9 w-64 rounded-md" />

          {/* Tabla */}
          <div className="overflow-hidden rounded-md border">
            {/* Header */}
            <div className="flex items-center gap-4 px-4 py-3 border-b bg-muted/30">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-16 ml-auto" />
            </div>
            {/* Rows */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-14 ml-auto" />
              </div>
            ))}
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-36" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
