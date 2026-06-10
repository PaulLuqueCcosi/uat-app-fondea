import { Skeleton } from '@/components/ui/skeleton';
import { getUserName } from '@/lib/user/get-user-name';
import { getUserSubtitle } from '@/lib/user/get-user-subtitle';
import { HeaderActions } from './HeaderActions';
import { HeaderScore } from './HeaderScore';
import { DashboardGreeting } from './DashboardGreeting';

async function HeaderContent() {
  const [name, subtitle] = await Promise.all([
    getUserName(),
    getUserSubtitle(),
  ]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <DashboardGreeting name={name} subtitle={subtitle} />
        <HeaderScore />
      </div>
      <HeaderActions />
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  );
}

export const Header = Object.assign(HeaderContent, {
  Skeleton: HeaderSkeleton,
});
