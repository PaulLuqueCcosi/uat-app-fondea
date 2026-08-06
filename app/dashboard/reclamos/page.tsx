import { Suspense } from 'react';
import { PageTitle } from '@/components/ui/page-title';
import { Card, CardContent } from '@/components/ui/card';
import { getMyComplaintsAction } from '@/app/actions/complaint.actions';
import { getFullProfile } from '@/app/actions/profile.actions';
import { ComplaintsPageClient } from '@/components/complaints/ComplaintsPageClient';

interface ComplaintsLoaderProps {
  page: number;
  pageSize: number;
}

async function ComplaintsLoader({ page, pageSize }: ComplaintsLoaderProps) {
  const [complaintsResult, profileResult] = await Promise.all([
    getMyComplaintsAction(page, pageSize),
    getFullProfile(),
  ]);

  if (!complaintsResult.ok) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-destructive">{complaintsResult.error.message}</p>
          <p className="text-xs text-muted-foreground mt-1">Intenta recargar la página.</p>
        </CardContent>
      </Card>
    );
  }

  const defaultPhone = profileResult.ok ? profileResult.data.contact.phone : null;
  const defaultEmail = profileResult.ok ? profileResult.data.contact.email : null;

  return (
    <ComplaintsPageClient
      complaints={complaintsResult.data.data}
      pagination={complaintsResult.data.pagination}
      defaultPhone={defaultPhone}
      defaultEmail={defaultEmail}
    />
  );
}

function ComplaintsLoaderSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="h-9 w-full max-w-xs bg-muted animate-pulse rounded-lg ml-auto" />
        <div className="h-16 w-full bg-muted animate-pulse rounded-lg" />
        <div className="h-16 w-full bg-muted animate-pulse rounded-lg" />
      </CardContent>
    </Card>
  );
}

interface Props {
  searchParams: Promise<{ page?: string; size?: string }>;
}

export default async function MisReclamosPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const pageSize = Number(sp.size) || 10;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <PageTitle
        title="Libro de Reclamaciones"
        description="Registra un reclamo o queja — plazo de respuesta: 15 días hábiles (Ley 32495)"
      />

      <Suspense fallback={<ComplaintsLoaderSkeleton />} key={`${page}-${pageSize}`}>
        <ComplaintsLoader page={page} pageSize={pageSize} />
      </Suspense>
    </div>
  );
}
