import { ClipboardList, CheckCircle, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { getKYCData } from '@/app/actions/kyc.actions';
import { getLaborProfileStatus } from '@/app/actions/labor.actions';
import { getEconomicProfileStatus } from '@/app/actions/economic.actions';
import { getAddressProfileStatus } from '@/app/actions/additional-address.actions';
import { getReferencesProfileStatus } from '@/app/actions/references.actions';
import { getBankAccountProfileStatus } from '@/app/actions/bank-account.actions';
import Link from 'next/link';

async function getExpedienteProgress() {
  const [kyc, labor, economic, address, references, bankAccount] = await Promise.all([
    getKYCData(),
    getLaborProfileStatus(),
    getEconomicProfileStatus(),
    getAddressProfileStatus(),
    getReferencesProfileStatus(),
    getBankAccountProfileStatus(),
  ]);

  const sections = [
    kyc.data?.status === 'VERIFIED',
    labor.overall_verified,
    economic.overall_verified,
    address.overall_verified,
    references.overall_verified,
    bankAccount.overall_verified,
  ];

  const totalCount = sections.length;
  const completedCount = sections.filter(Boolean).length;
  const progress = Math.round((completedCount / totalCount) * 100);

  return { progress, completedCount, totalCount };
}

async function ProgressBarContent() {
  const { progress, completedCount, totalCount } = await getExpedienteProgress();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Tus Expedientes
          </span>
        </CardTitle>
        <CardDescription>
          {completedCount} de {totalCount} secciones completadas
        </CardDescription>
        <CardAction>
          <span className="text-lg font-bold text-primary">{progress}%</span>
        </CardAction>
      </CardHeader>

      <CardContent>
        {/* Barra de progreso */}
        <div className="h-2.5 overflow-hidden rounded-full bg-border/50">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Info debajo de la barra */}
        <div className="flex items-center gap-2 mt-2.5 text-xs">
          <CheckCircle className={cn(
            "h-3.5 w-3.5",
            completedCount > 0 ? "text-primary" : "text-border"
          )} />
          <span className="font-medium text-foreground">{completedCount} completadas</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            {totalCount - completedCount} pendientes
          </span>
        </div>
      </CardContent>

      <CardFooter>
        <Link
          href="/dashboard/mi-expediente"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Ver expediente
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardFooter>
    </Card>
  );
}

function ProgressBarSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-5 w-32" />
          </span>
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-3.5 w-48" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="flex items-center gap-2 mt-2.5">
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
          <Skeleton className="h-3 w-32" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-4 w-28" />
      </CardFooter>
    </Card>
  );
}

export const ProgressBar = Object.assign(ProgressBarContent, {
  Skeleton: ProgressBarSkeleton,
});
