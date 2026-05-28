import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function QuickSettingsSectionSkeleton() {
  return (
    <Card>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <Skeleton className="w-7 h-7 rounded-full" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-full flex items-center justify-between px-5 py-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </div>
        ))}
      </div>
    </Card>
  );
}
