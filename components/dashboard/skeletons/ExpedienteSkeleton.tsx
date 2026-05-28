import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ExpedienteSkeleton() {
  return (
    <Card>
      <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
        <Skeleton className="w-7 h-7 rounded-full" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20 ml-auto" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3">
            <Skeleton className="w-7 h-7 rounded-full shrink-0" />
            <Skeleton className="h-4 w-32 flex-1" />
            <Skeleton className="h-5 w-16 hidden sm:block shrink-0" />
            <Skeleton className="h-4 w-12 shrink-0" />
          </div>
        ))}
      </div>
    </Card>
  );
}
