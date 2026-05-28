import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ProgressBarSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-7 w-12" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        <Skeleton className="h-3 w-full rounded-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}
