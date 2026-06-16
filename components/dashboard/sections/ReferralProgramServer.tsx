import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { getReferralData } from '@/modules/referrals';
import { ReferralProgram } from './ReferralProgram';
import { ModuleErrorState } from '@/components/shared/ModuleErrorState';

/**
 * Server component async que fetchea datos de referidos.
 * Se usa dentro de un <Suspense> en el dashboard.
 */
async function ReferralProgramContent() {
  const result = await getReferralData();

  if (!result.ok) {
    return <ModuleErrorState error={result.error} />;
  }

  return <ReferralProgram summary={result.data.summary} />;
}

function ReferralProgramSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

export const ReferralProgramSection = Object.assign(ReferralProgramContent, {
  Skeleton: ReferralProgramSkeleton,
});
