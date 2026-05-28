import { Skeleton } from '@/components/ui/skeleton';
import { getUser } from '@/app/actions/auth.actions';
import { HeaderActions } from './HeaderActions';
import { HeaderSubtitle } from './HeaderSubtitle';

async function HeaderContent() {
  const user = await getUser();
  const userName = user?.name || 'Usuario';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-500 mb-1">
          Hola, {userName}
        </h1>
        <HeaderSubtitle />
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
