import { Skeleton } from '@/components/ui/skeleton';
import { getUserName } from '@/modules/profile';
import { getUserSubtitle } from '@/modules/profile';
import { getActiveIntencion } from '@/app/actions/intencion.actions';
import { HeaderActions } from './HeaderActions';
import { DashboardGreeting } from './DashboardGreeting';

async function HeaderContent() {
  const [name, subtitle, intencionResult] = await Promise.all([
    getUserName(),
    getUserSubtitle(),
    getActiveIntencion(),
  ]);

  const hasActiveIntencion = intencionResult.ok && intencionResult.data != null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <DashboardGreeting name={name} subtitle={subtitle} />
      </div>
      <HeaderActions hasActiveIntencion={hasActiveIntencion} />
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
