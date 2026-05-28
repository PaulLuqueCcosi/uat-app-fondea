import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function LoanSectionSkeleton() {
  return (
    <Card>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <Skeleton className="w-7 h-7 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="px-5 py-5 flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </Card>
  );
}
