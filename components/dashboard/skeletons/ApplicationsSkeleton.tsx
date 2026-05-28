import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ApplicationsSkeleton() {
  return (
    <Card>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <Skeleton className="w-7 h-7 rounded-full" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20 ml-auto" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 3 }).map((_, i) => (
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
  );
}
