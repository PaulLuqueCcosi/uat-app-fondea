import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Skeleton para el grid de educación mientras se cargan los módulos.
 */
export function EducationGridSkeleton() {
  return (
    <>
      {/* Filtros skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-56 rounded-lg" />
        <Skeleton className="h-8 w-36 rounded-lg ml-auto" />
      </div>

      {/* Contador */}
      <Skeleton className="h-3 w-24" />

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="pt-0">
            <Skeleton className="aspect-video w-full rounded-t-xl" />
            <CardContent className="flex flex-col gap-2 pt-2.5 pb-3 px-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
