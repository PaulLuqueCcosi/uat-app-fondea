import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function EducationSectionSkeleton() {
  return (
    <Card>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <Skeleton className="w-7 h-7 rounded-full" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-5 py-3 flex flex-col gap-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-16 mt-1" />
          </div>
        ))}
      </div>
    </Card>
  );
}
