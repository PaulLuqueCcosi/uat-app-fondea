import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton para LoansListClient.
 * Muestra filtros skeleton + card skeleton para evitar layout shift.
 */
export function LoansListSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Filtros skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-28 rounded-full" />
        ))}
      </div>

      {/* Card skeleton */}
      <Card>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <Skeleton className="w-7 h-7 rounded-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-20 ml-auto" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton className="w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1 min-w-0 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-20 shrink-0" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
