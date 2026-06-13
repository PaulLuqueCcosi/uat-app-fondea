import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Skeleton para las cards de resumen del pasaporte.
 */
export function PassportSummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-4 pb-3 flex flex-col items-center gap-1.5">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-2.5 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
